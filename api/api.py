from flask_smorest import Blueprint, abort
from sqlalchemy import desc, text, or_, and_
from sqlalchemy.orm import Session
from sqlalchemy.sql.expression import func
from marshmallow import Schema
from marshmallow.fields import Nested, Float as MFloat, Integer as MInteger, List
from marshmallow_sqlalchemy import SQLAlchemyAutoSchema
from urllib.parse import unquote

from .db import engine
from .schema import *

def pp_to_limit_offset(pagination_parameters):
    limit = pagination_parameters.page_size
    offset = (pagination_parameters.page - 1) * limit
    return limit, offset

def get_current_round(session):
    latest_match = session.query(Matches)\
        .order_by(desc(Matches.season), desc(Matches.round))\
        .limit(1).one()
    return latest_match.round, latest_match.season

api_bp = Blueprint('api', __name__, url_prefix='/api')

class PlayerSchema(SQLAlchemyAutoSchema):
    class Meta:
        model = PlayersBySeason
        include_fk = True
        load_instance = True

class PlayerSeasonStatsSchema(PlayerSchema):
    games = MInteger()
    kicks = MInteger()
    handballs = MInteger()
    marks = MInteger()
    goals = MInteger()
    behinds = MInteger()
    tackles = MInteger()
    hitouts = MInteger()
    frees_for = MInteger()
    frees_against = MInteger()

class MatchesSchema(SQLAlchemyAutoSchema):
    class Meta:
        model = Matches
        include_fk = True
        load_instance = True
    home_score = MInteger()
    away_score = MInteger()

class PlayerStatsWithMatchSchema(SQLAlchemyAutoSchema):
    class Meta:
        model = PlayerStats
        include_fk = True
        load_instance = True
    match = Nested(MatchesSchema)

class PlayerStatsWithPlayerSchema(SQLAlchemyAutoSchema):
    class Meta:
        model = PlayerStats
        include_fk = True
        load_instance = True
        load_relationships = True
    player = Nested(PlayerSchema)

class LadderSchema(SQLAlchemyAutoSchema):
    class Meta:
        model = Ladder
        include_fk = True
        load_instance = True
    percent = MFloat()
    ladder_points = MInteger()

class NumMatchesSchema(Schema):
    num_matches = MInteger()

class DataSpanSchema(Schema):
    season = MInteger()
    min_round = MInteger()
    max_round = MInteger()

@api_bp.route('/match/<match_id>')
@api_bp.response(200, MatchesSchema)
def match(match_id):
    with Session(engine) as session:
        try:
            result = session.query(Matches)\
                .where(Matches.id == match_id)\
                .one()
        except Exception:
            abort(404)
        return MatchesSchema().dump(result)

@api_bp.route('/player/<player_id>')
@api_bp.response(200, PlayerSeasonStatsSchema(many=True))
def player(player_id):
    with Session(engine) as session:
        try:
            sql = text('''
                SELECT * FROM players_by_season pbs
                JOIN player_season_stats pss
                ON pbs.id = pss.player_id AND pbs.season = pss.season
                WHERE pbs.id = :player_id
                ORDER BY pbs.season DESC
            ''')
            results = session.execute(sql, {'player_id': player_id})
        except Exception:
            abort(404)
        schema = PlayerSeasonStatsSchema()
        return [schema.dump(x) for x in results]

@api_bp.route('/players/<search_str>')
@api_bp.paginate(max_page_size=50)
@api_bp.response(200, PlayerSchema(many=True))
def search_players(search_str, pagination_parameters):
    limit, offset = pp_to_limit_offset(pagination_parameters)
    search_str = unquote(search_str)
    with Session(engine) as session:
        try:
            subquery = session.query(PlayersBySeason.name, PlayersBySeason.id,
                    func.max(PlayersBySeason.season).label('season'))\
                .where(PlayersBySeason.name.ilike(f'%{search_str}%'))\
                .group_by(PlayersBySeason.name, PlayersBySeason.id)\
                .subquery()
            query = session.query(subquery, PlayersBySeason.team, PlayersBySeason.jumper_number)\
                .join(PlayersBySeason, and_(
                        PlayersBySeason.season == subquery.c.season,
                        PlayersBySeason.id == subquery.c.id,
                    ))\
                .order_by(PlayersBySeason.team)
            pagination_parameters.item_count = query.count()
            results = query.limit(limit).offset(offset).all()
        except Exception:
            abort(404)
        schema = PlayerSchema()
        return [schema.dump(x) for x in results]

@api_bp.route('/random_player')
@api_bp.response(200, PlayerSeasonStatsSchema(many=True))
def random_player():
    with Session(engine) as session:
        try:
            # Extract the ID of a random current player
            round, season = get_current_round(session)
            subquery = session.query(PlayersBySeason)\
                .distinct(PlayersBySeason.id)\
                .where(PlayersBySeason.season == season)\
                .subquery()
            result = session.query(subquery).order_by(func.random()).limit(1).one()
            sql = text('''
                SELECT * FROM players_by_season pbs
                JOIN player_season_stats pss
                ON pbs.id = pss.player_id AND pbs.season = pss.season
                WHERE pbs.id = :player_id
                ORDER BY pbs.season DESC
            ''')
            results = session.execute(sql, {'player_id': result.id})
        except Exception:
            abort(404)
        schema = PlayerSeasonStatsSchema()
        return [schema.dump(x) for x in results]

@api_bp.route('/players_by_team/<team_name>')
@api_bp.response(200, PlayerSchema(many=True))
def players_by_team(team_name):
    # Team names may have spaces
    team_name = unquote(team_name)
    with Session(engine) as session:
        try:
            round, season = get_current_round(session)
            results = session.query(PlayersBySeason)\
                .where(PlayersBySeason.season == season,
                    PlayersBySeason.team == team_name)\
                .order_by(PlayersBySeason.jumper_number)\
                .all()
        except Exception:
            abort(404)
        schema = PlayerSchema()
        return [schema.dump(x) for x in results]

@api_bp.route('/current_matches')
@api_bp.response(200, MatchesSchema(many=True))
def current_matches():
    with Session(engine) as session:
        try:
            round, season = get_current_round(session)
            results = session.query(Matches)\
                .where(Matches.season == season, Matches.round == round)\
                .order_by(Matches.id)\
                .all()
        except Exception:
            abort(404)
        schema = MatchesSchema()
        return [schema.dump(x) for x in results]

@api_bp.route('/matches_by_round/<season>/<round>')
@api_bp.response(200, MatchesSchema(many=True))
def matches_by_round(season, round):
    with Session(engine) as session:
        try:
            results = session.query(Matches)\
                .where(Matches.season == season, Matches.round == round)\
                .order_by(Matches.id)\
                .all()
        except Exception:
            abort(404)
        schema = MatchesSchema()
        return [schema.dump(x) for x in results]

@api_bp.route('/matches_by_team/<team_name>')
@api_bp.paginate(max_page_size=50)
@api_bp.response(200, MatchesSchema(many=True))
def matches_by_team(team_name, pagination_parameters):
    team_name = unquote(team_name)
    limit, offset = pp_to_limit_offset(pagination_parameters)
    with Session(engine) as session:
        try:
            query = session.query(Matches)\
                .where(or_(Matches.home_team == team_name,
                    Matches.away_team == team_name))\
                .order_by(desc(Matches.id))
            pagination_parameters.item_count = query.count()
            results = query.limit(limit).offset(offset).all()
        except Exception:
            abort(404)
        schema = MatchesSchema()
        return [schema.dump(x) for x in results]

@api_bp.route('/stats_by_player/<player_id>')
@api_bp.paginate(max_page_size=50)
@api_bp.response(200, PlayerStatsWithMatchSchema(many=True))
def stats_by_player(player_id, pagination_parameters):
    limit, offset = pp_to_limit_offset(pagination_parameters)
    with Session(engine) as session:
        try:
            query = session.query(PlayerStats, Matches)\
                .where(PlayerStats.player_id == player_id)\
                .join(Matches, Matches.id == PlayerStats.match_id)\
                .order_by(desc(PlayerStats.match_id))
            pagination_parameters.item_count = query.count()
            results = query.limit(limit).offset(offset).all()
        except Exception:
            abort(404)
        matches_schema = MatchesSchema()
        stats_schema = PlayerStatsWithMatchSchema()
        full_results = []
        for r in results:
            new_result = stats_schema.dump(r[0])
            new_result['match'] = matches_schema.dump(r[1])
            full_results.append(new_result)
        return full_results

@api_bp.route('/stats_by_match/<match_id>')
@api_bp.response(200, PlayerStatsWithPlayerSchema(many=True))
def stats_by_match(match_id):
    with Session(engine) as session:
        try:
            results = session.query(PlayerStats)\
                .where(PlayerStats.match_id == match_id)\
                .order_by(desc(PlayerStats.match_id))\
                .all()
        except Exception:
            abort(404)
        schema = PlayerStatsWithPlayerSchema()
        return [schema.dump(x) for x in results]

@api_bp.route('/current_ladder')
@api_bp.response(200, LadderSchema(many=True))
def current_ladder():
    with Session(engine) as session:
        try:
            round, season = get_current_round(session)
            results = session.query(Ladder)\
                .where(Ladder.season == season, Ladder.round == round)\
                .order_by(desc(Ladder.ladder_points), desc(Ladder.percent))\
                .all()
        except Exception:
            abort(404)
        schema = LadderSchema()
        return [schema.dump(x) for x in results]

@api_bp.route('/ladder_by_round/<season>/<round>')
@api_bp.response(200, LadderSchema(many=True))
def ladder_by_round(season, round):
    with Session(engine) as session:
        try:
            results = session.query(Ladder)\
                .where(Ladder.season == season, Ladder.round == round)\
                .order_by(desc(Ladder.ladder_points), desc(Ladder.percent))\
                .all()
        except Exception:
            abort(404)
        schema = LadderSchema()
        return [schema.dump(x) for x in results]

@api_bp.route('/data_span')
@api_bp.response(200, DataSpanSchema(many=True)) 
def data_span():
    with Session(engine) as session:
        try:
            results = session.query(Matches.season,
                    func.min(Matches.round.distinct()).label('min_round'),
                    func.max(Matches.round.distinct()).label('max_round'))\
                .group_by(Matches.season)\
                .order_by(Matches.season)\
                .all()
        except Exception:
            abort(404)
        return [DataSpanSchema().dump(x) for x in results]