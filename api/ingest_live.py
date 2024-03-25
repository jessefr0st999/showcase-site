import schedule
from dotenv import load_dotenv
from sqlalchemy import create_engine, desc, text
from sqlalchemy.orm import Session
from datetime import datetime
import time
import os
import requests

from schema import *
from ingest_historical import get_match_data, calculate_ladder

load_dotenv()
engine = create_engine(os.getenv('DATABASE_URI'))

def job():
    print(f'{datetime.now()}: beginning job')
    # Query all possible changes: last 3 entries (matches in progress) as well
    # as next 3 entries (matches which may have started in the last hour)
    # TODO: Some other method for checking current games and designating them
    # as live, perhaps updated via a websocket
    with Session(engine) as session:
        last_match_ids = session.query(Matches.id)\
            .order_by(desc(Matches.id))\
            .limit(3).all()
        last_match_ids = [x[0] for x in last_match_ids][::-1]
    future_match_ids = [last_match_ids[-1] + i + 1 for i in range(4)]
    for match_id in [*last_match_ids, *future_match_ids]:
        try:
            match_stats, player_stats, player_season_stats = \
                get_match_data(match_id)
            with Session(engine) as session:
                session.merge(Matches(**match_stats))
                for x in player_season_stats:
                    session.merge(PlayersBySeason(**x))
                session.commit()
                for x in player_stats:
                    session.merge(PlayerStats(**x))
                session.commit()
                print(f'Values upserted for match with ID {match_id}')
        except requests.HTTPError:
            print(f'No match found with ID {match_id}')
    calculate_ladder()
    with Session(engine) as session:
        sql = text('REFRESH MATERIALIZED VIEW player_season_stats;')
        session.execute(sql)

if __name__ == '__main__':
    schedule.every(5).minutes.do(job)
    while True:
        schedule.run_pending()
        time.sleep(1)