from dotenv import load_dotenv
from sqlalchemy import create_engine, desc, text
from sqlalchemy.orm import Session
from sqlalchemy.dialects.postgresql import insert
from datetime import datetime
import pytz
import time
import os
import requests
import json
import click

from api.schema import *
from api.api import *
from ingest_historical import get_match_data, calculate_ladder

load_dotenv()
engine = create_engine(os.getenv('DATABASE_URI'))
# TODO: Update this if running for during season with a different final home
# and away round
LAST_HNA_ROUND = 24

class LiveScheduler:
    def __init__(self, sleep_seconds, inactive_per_hour):
        self.sleep_seconds = sleep_seconds
        self.inactive_per_hour = inactive_per_hour
        with Session(engine) as session:
            earliest_live_id = session.query(Matches.id)\
                .where(Matches.live == True)\
                .order_by(Matches.id)\
                .limit(1).one_or_none()
        if earliest_live_id:
            self.earliest_live_id = earliest_live_id[0]
            self.active = True
        else:
            self.earliest_live_id = None
            self.active = False
        self.match_schema = MatchesSchema()
        self.players_by_season_schema = PlayerSchema()
        self.player_stats_schema = PlayerStatsSchema()

    def start(self):
        if self.sleep_seconds:
            while True:
                self.job()
                time.sleep(self.sleep_seconds)
        else:
            self.job()
    
    def job(self):
        # In inactive mode, only run in PM AET hours and (by default) every fifth minute
        if self.active:
            self.active_job()
            return
        aet_now = datetime.now(pytz.timezone('Australia/Melbourne'))
        if aet_now.hour < 12:
            print(f'{datetime.now()}: skipping inactive job (AM AET hours)')
            return
        if aet_now.minute % (60 // self.inactive_per_hour):
            print(f'{datetime.now()}: skipping inactive job (only running'
                f' during {self.inactive_per_hour} minutes in each hour)')
            return
        self.inactive_job()

    def active_job(self):
        print(f'{datetime.now()}: beginning active job')
        # Query the given match and the next two (no more than three matches
        # are ever concurrently active)
        possible_live_ids = range(self.earliest_live_id, self.earliest_live_id + 3)
        match_ended = False
        no_live_matches = True
        for match_id in possible_live_ids:
            try:
                match_stats, player_stats, player_season_stats = \
                    get_match_data(match_id)
                print(f'Match with ID {match_id} found')
            except requests.HTTPError:
                print(f'No match found with ID {match_id}')
                continue
            # If percent complete has reach 100, mark the next match as the
            # current earliest match
            no_live_matches = False
            match_stats['live'] = True
            percent_complete = match_stats.pop('percent_complete')
            if match_id == self.earliest_live_id and percent_complete == '100':
                match_ended = True
                match_stats['live'] = False
                self.earliest_live_id += 1
            with Session(engine) as session:
                # Notify websocket server of update to each current match
                requests.post('http://' + os.getenv('WEBSOCKET_HOST'),
                    data=json.dumps(self.match_schema.dump_auto_calc(match_stats)))
                query = insert(Matches).values(match_stats)
                query = query.on_conflict_do_update(constraint='matches_pkey',
                    set_={col: getattr(query.excluded, col) for col in match_stats})
                session.execute(query)
                query = insert(PlayersBySeason).values(player_season_stats)\
                    .on_conflict_do_nothing()
                session.execute(query)
                session.commit()
                query = insert(PlayerStats).values(player_stats)
                query = query.on_conflict_do_update(constraint='player_stats_pkey',
                    set_={col: getattr(query.excluded, col) for col in player_stats[0]})
                session.execute(query)
                session.commit()
                # Only update ladder and season averages when a match ends and only
                # update ladder during the home and away season
                if match_ended:
                    sql = text('REFRESH MATERIALIZED VIEW player_season_stats;')
                    session.execute(sql)
                    if int(match_stats['round']) <= LAST_HNA_ROUND:
                        calculate_ladder(session)
                    session.commit()
                print(f'Values upserted for live match with ID {match_id}')
        # If none of the previously live matches are active any more, return to
        # inactive mode
        if no_live_matches:
            self.earliest_live_id = None
            self.active = False
            print(f'No live matches found; switching to inactive mode')

    def inactive_job(self):
        print(f'{datetime.now()}: beginning inactive job')
        with Session(engine) as session:
            next_match_id = session.query(Matches.id)\
                .order_by(desc(Matches.id))\
                .limit(1).one()[0] + 1
        try:
            match_stats, _, player_stats, player_season_stats = \
                get_match_data(next_match_id)
        except requests.HTTPError:
            print(f'No match found with ID {next_match_id}')
            return
        with Session(engine) as session:
            # NOTE: Setting this match as live should only be done if the match
            # is actually live; a historical backfill should always be done
            # before running this live script
            match_stats['live'] = True
            # Notify websocket server of new match
            requests.post('http://' + os.getenv('WEBSOCKET_HOST'),
                data=json.dumps(self.match_schema.dump_auto_calc(match_stats)))
            query = insert(Matches).values(match_stats)
            session.execute(query)
            query = insert(PlayersBySeason).values(player_season_stats)\
                .on_conflict_do_nothing()
            session.execute(query)
            session.commit()
            query = insert(PlayerStats).values(player_stats)
            session.execute(query)
            session.commit()
        print(f'Match with ID {next_match_id} found and values upserted; switching to active mode')
        self.earliest_live_id = next_match_id
        self.active = True

@click.command()
@click.option('--sleep_seconds', default=None, type=click.INT)
@click.option('--inactive_per_hour', default=12, type=click.INT)
def main(sleep_seconds, inactive_per_hour):
    # Omit sleep_seconds when running as a cron job
    schedule = LiveScheduler(sleep_seconds, inactive_per_hour)
    schedule.start()

if __name__ == '__main__':
    main()