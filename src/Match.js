import { useState, useEffect } from 'react';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableRow from '@mui/material/TableRow';
import Grid from'@mui/material/Grid';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import { useParams, Link } from 'react-router-dom';

import { apiRequester, getRoundName } from './helpers.js';

const renderPositions = playerStats => {
  if (!playerStats) {
    return null;
  }
  // Some data lacks position info
  if (!playerStats[0].position) {
    const getSurname = x => x.player.name.split('.').slice(-1)[0];
    playerStats.sort((a, b) => getSurname(a).localeCompare(getSurname(b)));
    return <TableContainer>
        <Table size='small'>
          <TableBody>
            {(new Array(8)).fill(null).map((_, i) => <TableRow key={i}>
                {playerStats.slice(3 * i, 3 * (i + 1)).map(x =>
                  <TableCell align='center' key={x.player.id}>
                    <Link to={`/player/${x.player.id}`}>{x.player.name}</Link>
                  </TableCell>)}
              </TableRow>)}
          </TableBody>
        </Table>
      </TableContainer>
  }
  const benchPlayers = playerStats.filter(x => x.position == 'INT');
  const subPlayer = playerStats.find(x => x.position == 'SUB');
  const emgPlayer = playerStats.find(x => x.position == 'EMG');
  const renderPlayerCell = position => {
    const x = playerStats.find(x => x.position == position);
    // Some data has missing players; render a blank cell in their place
    return x ? <TableCell align='center'>
      <Link to={`/player/${x.player.id}`}>{x.player.name}</Link>
    </TableCell> : <TableCell align='center'></TableCell>;
  }
  return <TableContainer>
    <Table size='small'>
      <TableBody>
        <TableRow>
          <TableCell align='center'>B</TableCell>
          {renderPlayerCell('BPL')}
          {renderPlayerCell('FB')}
          {renderPlayerCell('BPR')}
        </TableRow>
        <TableRow>
          <TableCell align='center'>HB</TableCell>
          {renderPlayerCell('HBFL')}
          {renderPlayerCell('CHB')}
          {renderPlayerCell('HBFR')}
        </TableRow>
        <TableRow>
          <TableCell align='center'>C</TableCell>
          {renderPlayerCell('WL')}
          {renderPlayerCell('C')}
          {renderPlayerCell('WR')}
        </TableRow>
        <TableRow>
          <TableCell align='center'>HF</TableCell>
          {renderPlayerCell('HFFL')}
          {renderPlayerCell('CHF')}
          {renderPlayerCell('HFFR')}
        </TableRow>
        <TableRow>
          <TableCell align='center'>F</TableCell>
          {renderPlayerCell('FPL')}
          {renderPlayerCell('FF')}
          {renderPlayerCell('FPR')}
        </TableRow>
        <TableRow>
          <TableCell align='center'>R</TableCell>
          {renderPlayerCell('RK')}
          {renderPlayerCell('RR')}
          {renderPlayerCell('R')}
        </TableRow>
        <TableRow>
          <TableCell align='center'>I</TableCell>
          {benchPlayers.slice(0, 3).map(x => <TableCell align='center' key={x.player_id}>
              <Link to={`/player/${x.player.id}`}>{x.player.name}</Link>
            </TableCell>)}
        </TableRow>
        <TableRow>
          <TableCell align='center'></TableCell>
          {benchPlayers.length > 3
            ? benchPlayers.slice(3).map(x => <TableCell align='center' key={x.player_id}>
              <Link to={`/player/${x.player.id}`}>{x.player.name}</Link>
            </TableCell>) : null}
          {subPlayer ? <TableCell align='center'>
              <Link to={`/player/${subPlayer.player.id}`}>{subPlayer.player.name}</Link> (sub)
            </TableCell> : null}
          {emgPlayer ? <TableCell align='center'>
              <Link to={`/player/${emgPlayer.player.id}`}>{emgPlayer.player.name}</Link> (emg)
            </TableCell> : null}
        </TableRow>
      </TableBody>
    </Table>
  </TableContainer>
}

const renderMatchInfo = match => {
  return match ? <Card variant={'outlined'} key={match.id}>
    <CardContent>
      <Typography gutterBottom variant='h5' component='div'>
        {getRoundName(match.season, match.round, false)}{' '}{match.season}
      </Typography>
      <Typography gutterBottom variant='h5' component='div'>
        {`${match.home_team} ${match.home_goals}-${match.home_behinds}-${match.home_score}
          vs ${match.away_team} ${match.away_goals}-${match.away_behinds}-${match.away_score}`}
      </Typography>
      <Typography variant='body2' color='text.secondary'>
        {match.location}
      </Typography>
    </CardContent>
  </Card> : null
}

function Match() {
  const { matchId } = useParams();
  const matchUrl = `/api/match/${matchId}`;
  const statsByMatchUrl = `/api/stats_by_match/${matchId}`;
  const [match, setMatch] = useState(null);
  const [homePlayerStats, setHomePlayerStats] = useState(null);
  const [awayPlayerStats, setAwayPlayerStats] = useState(null);
  useEffect(() => {
    const matchDataPromise = apiRequester({url: matchUrl});
    const statsDataPromise = apiRequester({url: statsByMatchUrl});
    Promise.all([matchDataPromise, statsDataPromise]).then(values => {
      const _match = values[0];
      setMatch(_match);
      setHomePlayerStats(values[1].filter(x => x.player.team == _match.home_team));
      setAwayPlayerStats(values[1].filter(x => x.player.team == _match.away_team));
    });
  }, []);

  return (
    <div className='app'>
      {match ? <Grid container spacing={2}>  
        <Grid item xs={12} md={12}>{renderMatchInfo(match)}</Grid>
        <Grid item container xs={12} md={12} spacing={2}>
          <Grid item xs={12} md={6}>
            <Card variant={'outlined'}>
              <h3><Link to={`/team/${match.home_team}`}>{match.home_team}
                </Link> (home)</h3>
              {renderPositions(homePlayerStats)}
            </Card>
          </Grid>
          <Grid item xs={12} md={6}>
            <Card variant={'outlined'}>
              <h3><Link to={`/team/${match.away_team}`}>{match.away_team}
                </Link> (away)</h3>
              {renderPositions(awayPlayerStats)}
            </Card>
          </Grid>
        </Grid>
      </Grid> : null}
    </div>
  );
};

export default Match;