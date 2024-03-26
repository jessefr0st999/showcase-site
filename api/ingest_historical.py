from dotenv import load_dotenv
from sqlalchemy import create_engine, desc, and_, or_, text, update
from sqlalchemy.orm import Session
from sqlalchemy.dialects.postgresql import insert
from xml.etree import ElementTree
from lxml.etree import XMLParser
import requests
import os

from .schema import *

load_dotenv()
engine = create_engine(os.getenv('DATABASE_URI'))

BASE_URL = 'https://www.dtlive.com.au/afl/xml'
SEASON_MATCH_IDS = {
    2014: (19, 639),
    2015: (667, 873),
    2016: (874, 1107),
    2017: (1135, 1341),
    2018: (1360, 1566),
    2019: (1585, 1791),
    2020: (1810, 2188),
    2021: (2198, 2412),
    2022: (2422, 2628),
    2023: (2638, 2853),
    2024: (2863, 2878),
}
MATCH_PROPERTIES_MAP = {
    'Round': 'round',
    'Year': 'season',
    'Location': 'location',
    'HomeTeam': 'home_team',
    'AwayTeam': 'away_team',
    'HomeTeamGoal': 'home_goals',
    'HomeTeamBehind': 'home_behinds',
    'AwayTeamGoal': 'away_goals',
    'AwayTeamBehind': 'away_behinds',
}
PLAYER_PROPERTIES_MAP = {
    'PlayerID': 'player_id',
    'Kick': 'kicks',
    'Handball': 'handballs',
    'Mark': 'marks',
    'Hitout': 'hitouts',
    'Tackle': 'tackles',
    'FreeFor': 'frees_for',
    'FreeAgainst': 'frees_against',
    'Goal': 'goals',
    'Behind': 'behinds',
    'Selection': 'position',
}

def get_match_data(match_number):
    url = f'{BASE_URL}/{match_number}.xml'
    response = requests.get(url)
    response.raise_for_status()
    root = ElementTree.fromstring(response.text.encode('utf-8'),
        parser=XMLParser(encoding='utf-8', recover=True))
    match_stats = {'id': match_number}
    player_stats = []
    player_season_stats = []
    for child in root:
        if child.tag == 'Game':
            for property in child:
                if property.tag in MATCH_PROPERTIES_MAP:
                    key = MATCH_PROPERTIES_MAP[property.tag]
                    match_stats[key] = property.text
                    # Handle different name in dataset for GWS
                    if (key == 'home_team' or key == 'away_team') and \
                            property.text == 'GWS Giants':
                        match_stats[key] = 'Greater Western Sydney'
                        
        elif child.tag in ['Home', 'Away']:
            for player in child:
                _player_stats = {
                    'match_id': match_number,
                    'season': match_stats['season'],
                    'subbed_on': False,
                    'subbed_off': False,
                }
                _player_season_stats = {'season': match_stats['season']}
                for property in player:
                    if property.tag in PLAYER_PROPERTIES_MAP:
                        key = PLAYER_PROPERTIES_MAP[property.tag]
                        _player_stats[key] = property.text
                        if key == 'position' and property.text and \
                                property.text.startswith('INT'):
                            _player_stats[key] = 'INT'
                    if property.tag == 'IconImage':
                        if property.text == 'greenvest.png':
                            _player_stats['subbed_on'] = True
                        elif property.text == 'redvest.png':
                            _player_stats['subbed_off'] = True
                    if property.tag == 'Name':
                        _player_season_stats['name'] = property.text
                    if property.tag == 'PlayerID':
                        _player_season_stats['id'] = property.text
                    if property.tag == 'JumperNumber':
                        _player_season_stats['jumper_number'] = property.text
                    _player_season_stats['team'] = match_stats['home_team'] \
                        if child.tag == 'Home' else match_stats['away_team']
                player_stats.append(_player_stats)
                player_season_stats.append(_player_season_stats)
    return match_stats, player_stats, player_season_stats

def calculate_ladder(season=None, latest_round=True):
    with Session(engine) as session:
        # Default to latest season and round
        latest_match = session.query(Matches)\
            .order_by(desc(Matches.season), desc(Matches.round))\
            .limit(1).one()
        if season is None:
            season = latest_match.season
        if latest_round:
            last_round = latest_match.round
        else:
            # Minus 4 for final home and away round
            last_round = session.query(Matches.round)\
                .distinct(Matches.round)\
                .order_by(desc(Matches.round)).limit(1).one()[0] - 4
        teams = session.query(Teams.name).all()
        teams = [x[0] for x in teams]
        for team in teams:
            for round in range(1, last_round + 1):
                matches = session.query(Matches)\
                    .where(and_(
                            Matches.season == season,
                            Matches.round <= round,
                            or_(Matches.home_team == team, Matches.away_team == team)
                        ))\
                    .order_by(Matches.id).all()
                wins = 0
                losses = 0
                draws = 0
                pf = 0
                pa = 0
                for _match in matches:
                    if _match.home_score == _match.away_score:
                        draws += 1
                        pf += _match.home_score
                        pa += _match.away_score
                    elif _match.home_team == team:
                        pf += _match.home_score
                        pa += _match.away_score
                        if _match.home_score > _match.away_score:
                            wins += 1
                        else:
                            losses += 1
                    else:
                        pf += _match.away_score
                        pa += _match.home_score
                        if _match.home_score > _match.away_score:
                            losses += 1
                        else:
                            wins += 1
                team_season_stats = Ladder(**{
                    'team': team,
                    'season': season,
                    'round': round,
                    'wins': wins,
                    'losses': losses,
                    'draws': draws,
                    'points_for': pf,
                    'points_against': pa,
                })
                session.merge(team_season_stats)
        session.commit()

if __name__ == '__main__':
    for season in SEASON_MATCH_IDS:
        start_id, end_id = SEASON_MATCH_IDS[season]
        match_id = start_id
        match_stats = []
        player_stats = []
        player_season_stats = []
        while match_id <= end_id:
            try:
                _match_stats, _player_stats, _player_season_stats = \
                    get_match_data(match_id)
                if match_id % 10 == 0:
                    print(f'{season}: Data for match with ID {match_id} obtained'
                        f' ({match_id - start_id} / {end_id - start_id})')
                match_stats.append(_match_stats)
                player_stats.extend(_player_stats)
                player_season_stats.extend(_player_season_stats)
            except requests.HTTPError:
                print(f'No match found with ID {match_id}')
            match_id += 1
        with Session(engine) as session:
            query = insert(Matches).values(match_stats)\
                .on_conflict_do_nothing()
            session.execute(query)
            query = insert(PlayersBySeason).values(player_season_stats)\
                .on_conflict_do_nothing()
            session.execute(query)
            session.commit()
            query = insert(PlayerStats).values(player_stats)\
                .on_conflict_do_nothing()
            session.execute(query)
            session.commit()
        print(f'{season}: Values upserted for matches with IDs {start_id} to {end_id}')
        calculate_ladder(season, latest_round=True)
    with Session(engine) as session:
        sql = text('REFRESH MATERIALIZED VIEW player_season_stats;')
        session.execute(sql)
        # Fix a player entered with different names
        query = update(PlayersBySeason)\
            .where(PlayersBySeason.team == 'Richmond', PlayersBySeason.name == 'D.Smith')\
            .values(name='D.Eggmolesse-Smith')
        session.execute(query)
        session.commit()