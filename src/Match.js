import { useState, useEffect } from 'react';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Grid from'@mui/material/Grid';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import { Circle } from '@mui/icons-material';
import { useParams, Link } from 'react-router-dom';
import useWebSocket, { ReadyState } from 'react-use-websocket';

import { apiRequester, getRoundName, formatMatchTime } from './helpers.js';
import { WEBSOCKET_URI } from './secrets.js';

const getSurname = x => x.player.name.split('.').slice(-1)[0];

const renderMatchInfo = match => {
  if (!match) {
    return null;
  }
  const homePlayerStats = match.player_stats.filter(x => x.player.team == match.home_team);
  const awayPlayerStats = match.player_stats.filter(x => x.player.team == match.away_team);
  const homeGoalkickers = homePlayerStats.filter(x => x.goals > 0)
    .sort((a, b) => b.goals > a.goals);
  const awayGoalkickers = awayPlayerStats.filter(x => x.goals > 0)
    .sort((a, b) => b.goals > a.goals);
  return <Card variant={'outlined'} style={{width: 'min(100%, 800px)', margin: 'auto'}}>
    <CardContent>
      <Typography gutterBottom variant='h5' component='div' className='live-marker-container'>
        <span>
          <Link to={`/team/${match.home_team}`}>{match.home_team}</Link>
          {' '}{match.home_goals}-{match.home_behinds}-{match.home_score}
          {' '}vs <Link to={`/team/${match.away_team}`}>{match.away_team}</Link>
          {' '}{match.away_goals}-{match.away_behinds}-{match.away_score}
          {match.live ? ` (Q${match.quarter} ${formatMatchTime(match.time)})` : ''}
        </span>
        {match.live ? <Circle className='live-marker'></Circle> : null}
      </Typography>
      <Typography variant='body2' color='text.secondary'>
        {match.location}
      </Typography>
      <Typography variant='body2'>
        <b>{match.home_team} goals:</b> {homeGoalkickers
          .map((x, i) => <span key={'goals-' + x.player_id}>
            {x.player.name}{x.goals > 1 ? ' ' + x.goals : ''}
            {i < homeGoalkickers.length - 1 ? ', ' : ''}
          </span>)}
      </Typography>
      <Typography variant='body2'>
        <b>{match.away_team} goals:</b> {awayGoalkickers
          .map((x, i) => <span key={'goals-' + x.player_id}>
            {x.player.name}{x.goals > 1 ? ' ' + x.goals : ''}
            {i < awayGoalkickers.length - 1 ? ', ' : ''}
          </span>)}
      </Typography>
    </CardContent>
  </Card>
}

const renderPositions = playerStats => {
  if (!playerStats) {
    return null;
  }
  // Some data lacks position info
  if (!playerStats[0].position) {
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

const renderPlayerStats = playerStats => {
  playerStats.sort((a, b) => a.player.jumper_number > b.player.jumper_number);
  return playerStats ? <TableContainer>
    <Table size='small'>
      <TableHead>
        <TableRow>
          <TableCell>Player</TableCell>
          <TableCell align='right'>Score</TableCell>
          <TableCell align='right'>Disposals</TableCell>
          <TableCell align='right'>Kicks</TableCell>
          <TableCell align='right'>Handballs</TableCell>
          <TableCell align='right'>Marks</TableCell>
          <TableCell align='right'>Tackles</TableCell>
          <TableCell align='right'>Hitouts</TableCell>
          <TableCell align='right'>Frees (F/A)</TableCell>
        </TableRow>
      </TableHead>
      <TableBody>
        {playerStats.map(x => <TableRow
            key={'stats-' + x.player.id}
            sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
          >
            <TableCell>#{x.player.jumper_number}{' '}
              <Link to={`/player/${x.player.id}`}>{x.player.name}</Link></TableCell>
            <TableCell align='right'>{x.goals}.{x.behinds}</TableCell>
            <TableCell align='right'>{x.kicks + x.handballs}</TableCell>
            <TableCell align='right'>{x.kicks}</TableCell>
            <TableCell align='right'>{x.handballs}</TableCell>
            <TableCell align='right'>{x.marks}</TableCell>
            <TableCell align='right'>{x.tackles}</TableCell>
            <TableCell align='right'>{x.hitouts}</TableCell>
            <TableCell align='right'>{x.frees_for}/{x.frees_against}</TableCell>
          </TableRow>
        )}
      </TableBody>
    </Table>
  </TableContainer> : null;
}

function Match() {
  const { matchId } = useParams();
  const matchUrl = `/api/match/${matchId}`;
  const [match, setMatch] = useState(null);
  useEffect(() => {
    apiRequester({url: matchUrl})
      .then(data => setMatch(data))
  }, []);

  const { sendJsonMessage, lastJsonMessage, readyState } = useWebSocket(
    WEBSOCKET_URI, {share: false, shouldReconnect: () => true})

  useEffect(() => {
    if (readyState === ReadyState.OPEN) {
      sendJsonMessage({event: 'subscribe'})
    }
  }, [readyState]);

  useEffect(() => {
    if (!lastJsonMessage) {
      return;
    }
    if (match && match.id == lastJsonMessage.id) {
      // Update the current match
      setMatch(lastJsonMessage);
    }
  }, [lastJsonMessage]);

  return (
    <div className='app' style={{flexDirection: 'column'}}>
      {match ? <>
        <h1>{getRoundName(match.season, match.round, false)}{' '}{match.season}</h1>
        <Grid container spacing={2}>  
          <Grid item xs={12} md={12}>{renderMatchInfo(match)}</Grid>
          <Grid item container xs={12} md={12} spacing={2}>
            <Grid item xs={12} md={6}>
              <Card variant={'outlined'}>
                <CardContent>
                  <Typography variant='h5' component='div'>
                    <Link to={`/team/${match.home_team}`}>{match.home_team}</Link> (home)
                  </Typography>
                  {renderPositions(match.player_stats.filter(x => x.player.team == match.home_team))}
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={6}>
              <Card variant={'outlined'}>
                <CardContent>
                  <Typography variant='h5' component='div'>
                    <Link to={`/team/${match.away_team}`}>{match.away_team}</Link> (away)
                  </Typography>
                  {renderPositions(match.player_stats.filter(x => x.player.team == match.away_team))}
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={6}>
              <Card variant={'outlined'}>
                <CardContent>
                  <Typography variant='h5' component='div'>
                    <Link to={`/team/${match.home_team}`}>{match.home_team}</Link> (home)
                  </Typography>
                  {renderPlayerStats(match.player_stats.filter(x => x.player.team == match.home_team))}
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={6}>
              <Card variant={'outlined'}>
                <CardContent>
                  <Typography variant='h5' component='div'>
                    <Link to={`/team/${match.away_team}`}>{match.away_team}</Link> (away)
                  </Typography>
                  {renderPlayerStats(match.player_stats.filter(x => x.player.team == match.away_team))}
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Grid>
      </> : null}
    </div>
  );
};

export default Match;