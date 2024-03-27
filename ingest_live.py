from dotenv import load_dotenv
from sqlalchemy import create_engine, desc, text
from sqlalchemy.orm import Session
from sqlalchemy.dialects.postgresql import insert
from datetime import datetime
import pytz
import time
import os
import requests

from api.schema import *
from ingest_historical import get_match_data, calculate_ladder

load_dotenv()
engine = create_engine(os.getenv('DATABASE_URI'))
# TODO: Update this if running for during season with a different final home
# and away round
LAST_HNA_ROUND = 24

class LiveScheduler:
    def __init__(self, sleep_seconds, num_non_active_runs):
        self.sleep_seconds = sleep_seconds
        self.num_non_active_runs = num_non_active_runs
        self.current_non_active_runs = 0
        self.active = False
        self.earliest_live_id = None
        self.earliest_live_q4_time = None

    def start(self):
        while True:
            self.job()
            time.sleep(self.sleep_seconds)
    
    def job(self):
        # In inactive mode, only run every fifth minute and in PM AET hours
        if self.active:
            self.current_non_active_runs = 0
        else:
            print('runs', self.current_non_active_runs,
                'hour', datetime.now(pytz.timezone('Australia/Melbourne')).hour)
            self.current_non_active_runs += 1
            if self.current_non_active_runs % self.num_non_active_runs != 1:
                return
            if datetime.now(pytz.timezone('Australia/Melbourne')).hour < 12:
                return
        print(f'{datetime.now()}: beginning job')
        if self.active:
            self.active_job()
        else:
            self.inactive_job()

    def active_job(self):
        # Query the given match and the next two (no more than three matches
        # are ever concurrently active)
        possible_live_ids = range(self.earliest_live_id, self.earliest_live_id + 3)
        match_ended = False
        no_live_matches = True
        match_stats = []
        player_stats = []
        player_season_stats = []
        for match_id in possible_live_ids:
            try:
                _match_stats, _match_time_stats, _player_stats, _player_season_stats = \
                    get_match_data(match_id)
                print(f'Match with ID {match_id} found')
            # except requests.HTTPError:
            except FileNotFoundError:
                print(f'No match found with ID {match_id}')
                continue
            # If the time in the 4th quarter is the same as the last request,
            # consider the match complete and mark the next match as the current
            # earliest match
            no_live_matches = False
            _match_stats['live'] = True
            if match_id == self.earliest_live_id and _match_time_stats['quarter'] == '4':
                if self.earliest_live_q4_time == _match_time_stats['time']:
                    match_ended = True
                    _match_stats['live'] = False
                    self.earliest_live_id += 1
                    self.earliest_live_q4_time = None
                else:
                    self.earliest_live_q4_time = _match_time_stats['time']
            match_stats.append(_match_stats)
            player_stats.extend(_player_stats)
            player_season_stats.extend(_player_season_stats)
        # If none of the previously live matches are active any more, return to
        # inactive mode
        if no_live_matches:
            self.earliest_live_id = None
            self.active = False
            print(f'No live matches found; switching to inactive mode')
            return
        with Session(engine) as session:
            print([x['home_goals'] for x in match_stats])
            for x in match_stats:
                query = insert(Matches).values(match_stats)
                query = query.on_conflict_do_update(constraint='matches_pkey',
                    set_={col: getattr(query.excluded, col) for col in x})
                session.execute(query)
            query = insert(PlayersBySeason).values(player_season_stats)\
                .on_conflict_do_nothing()
            session.execute(query)
            session.commit()
            for x in player_stats:
                query = insert(PlayerStats).values(player_stats)
                query = query.on_conflict_do_update(constraint='player_stats_pkey',
                    set_={col: getattr(query.excluded, col) for col in x})
                session.execute(query)
            session.commit()
            # Only update ladder and season averages when a match ends and only
            # update ladder during the home and away season
            if match_ended:
                sql = text('REFRESH MATERIALIZED VIEW player_season_stats;')
                session.execute(sql)
                if int(match_stats[0]['round']) <= LAST_HNA_ROUND:
                    calculate_ladder(session)
                session.commit()
            print(f'Values upserted for found live matches')

    def inactive_job(self):
        with Session(engine) as session:
            next_match_id = session.query(Matches.id)\
                .order_by(desc(Matches.id))\
                .limit(1).one()[0] + 1
        try:
            match_stats, _, player_stats, player_season_stats = \
                get_match_data(next_match_id)
        # except requests.HTTPError:
        except FileNotFoundError:
            print(f'No match found with ID {next_match_id}; job exiting')
            return
        with Session(engine) as session:
            # NOTE: Setting this match as live should only be done if the match
            # is actually live; a historical backfill should always be done
            # before running this live script
            query = insert(Matches).values({'live': True, **match_stats})
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

if __name__ == '__main__':
    # schedule = LiveScheduler(sleep_seconds=60, num_non_active_runs=5)
    schedule = LiveScheduler(sleep_seconds=10, num_non_active_runs=5)
    schedule.start()