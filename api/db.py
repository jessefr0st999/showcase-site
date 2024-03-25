from sqlalchemy import create_engine
from sqlalchemy.orm import Session
from dotenv import load_dotenv
import os

from schema import Base, Teams

load_dotenv()
engine = create_engine(os.getenv('DATABASE_URI'))

if __name__ == '__main__':
    # Create all tables defined in schema.py
    Base.metadata.create_all(engine)

    with Session(engine) as session:
        # Populate teams table
        teams = [Teams(name=name, nickname=nickname) for name, nickname in [
            ('Adelaide', 'Crows'),
            ('Brisbane', 'Lions'),
            ('Carlton', 'Blues'),
            ('Collingwood', 'Magpies'),
            ('Essendon', 'Bombers'),
            ('Fremantle', 'Dockers'),
            ('Geelong', 'Cats'),
            ('Gold Coast', 'Suns'),
            ('Greater Western Sydney', 'Giants'),
            ('Hawthorn', 'Hawks'),
            ('Melbourne', 'Demons'),
            ('North Melbourne', 'Kangaroos'),
            ('Port Adelaide', 'Power'),
            ('Richmond', 'Tigers'),
            ('St Kilda', 'Saints'),
            ('Sydney', 'Swans'),
            ('West Coast', 'Eagles'),
            ('Western Bulldogs', 'Bulldogs'),
        ]]
        session.add_all(teams)
        session.commit()

        # Create materialised view for per-season statistics
        session.execute('''
            CREATE MATERIALIZED VIEW player_season_stats AS
            SELECT player_id, season,
                COUNT(kicks) AS games,
                SUM(kicks) AS kicks,
                SUM(handballs) AS handballs,
                SUM(marks) AS marks,
                SUM(goals) AS goals,
                SUM(behinds) AS behinds,
                SUM(tackles) AS tackles,
                SUM(hitouts) AS hitouts,
                SUM(frees_for) AS frees_for,
                SUM(frees_against) AS frees_against
            FROM player_stats
            GROUP BY player_id, season;
        ''')