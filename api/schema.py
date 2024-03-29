from sqlalchemy import ForeignKey, String, Integer, Boolean, ForeignKeyConstraint
from sqlalchemy.orm import DeclarativeBase, mapped_column, relationship
from sqlalchemy.ext.hybrid import hybrid_property

class Base(DeclarativeBase):
    pass

class Teams(Base):
    __tablename__ = 'teams'
    name = mapped_column(String(30), primary_key=True)
    nickname = mapped_column(String(30))

class Matches(Base):
    __tablename__ = 'matches'
    id = mapped_column(Integer, primary_key=True)
    round = mapped_column(Integer)
    season = mapped_column(Integer)
    location = mapped_column(String(30))
    home_team = mapped_column(String(30), ForeignKey('teams.name'))
    away_team = mapped_column(String(30), ForeignKey('teams.name'))
    home_goals = mapped_column(Integer)
    home_behinds = mapped_column(Integer)
    away_goals = mapped_column(Integer)
    away_behinds = mapped_column(Integer)
    live = mapped_column(Boolean)
    time = mapped_column(String(10))
    percent_complete = mapped_column(Integer)

    player_stats = relationship('PlayerStats', backref='match')
    
    @hybrid_property
    def home_score(self):
        return 6 * self.home_goals + self.home_behinds
    
    @hybrid_property
    def away_score(self):
        return 6 * self.away_goals + self.away_behinds

# NOTE: Does not handle players changing names, teams or jumper numbers midway
# through a season. Will have to be updated if a mid-season trade period is
# introduced or manually handled in the case of a special jumper number in the
# opening round or a player changing names
class PlayersBySeason(Base):
    __tablename__ = 'players_by_season'
    id = mapped_column(Integer, primary_key=True)
    season = mapped_column(Integer, primary_key=True)
    name = mapped_column(String(100))
    team = mapped_column(String(30), ForeignKey('teams.name'))
    jumper_number = mapped_column(Integer)

class Ladder(Base):
    __tablename__ = 'ladder'
    team = mapped_column(String(30), ForeignKey('teams.name'), primary_key=True)
    season = mapped_column(Integer, primary_key=True)
    round = mapped_column(Integer, primary_key=True)
    wins = mapped_column(Integer)
    losses = mapped_column(Integer)
    draws = mapped_column(Integer)
    points_for = mapped_column(Integer)
    points_against = mapped_column(Integer)

    @hybrid_property
    def ladder_points(self):
        return 4 * self.wins + 2 * self.draws
    
    @hybrid_property
    def percent(self):
        if self.points_against == 0:
            return 0
        return 100 * self.points_for / self.points_against

class PlayerStats(Base):
    __tablename__ = 'player_stats'
    match_id = mapped_column(Integer, ForeignKey('matches.id'), primary_key=True)
    season = mapped_column(Integer)
    player_id = mapped_column(Integer, primary_key=True)
    position = mapped_column(String(30))
    kicks = mapped_column(Integer)
    handballs = mapped_column(Integer)
    marks = mapped_column(Integer)
    goals = mapped_column(Integer)
    behinds = mapped_column(Integer)
    tackles = mapped_column(Integer)
    hitouts = mapped_column(Integer)
    frees_for = mapped_column(Integer)
    frees_against = mapped_column(Integer)
    subbed_on = mapped_column(Boolean)
    subbed_off = mapped_column(Boolean)

    player = relationship('PlayersBySeason', foreign_keys=[player_id, season])
    __table_args__ = (
        ForeignKeyConstraint(
            [player_id, season], [PlayersBySeason.id, PlayersBySeason.season]
        ),
    )
    
    @hybrid_property
    def disposals(self):
        return self.kicks + self.handballs