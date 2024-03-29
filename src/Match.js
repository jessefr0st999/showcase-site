import { useState, useEffect, useMemo } from 'react';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import TableSortLabel from '@mui/material/TableSortLabel';
import Grid from'@mui/material/Grid';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import { Circle } from '@mui/icons-material';
import { useParams, Link } from 'react-router-dom';
import useWebSocket, { ReadyState } from 'react-use-websocket';
import { visuallyHidden } from '@mui/utils';

import { apiRequester, getRoundName, formatLiveText } from './helpers.js';
import { WEBSOCKET_URI } from './secrets.js';

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
  const liveText = formatLiveText(match);
  return <Card variant={'outlined'} style={{width: 'min(100%, 800px)', margin: 'auto'}}>
    <CardContent>
      <Typography gutterBottom variant='h5' component='div' className='live-marker-container'>
        <span>
          <Link to={`/team/${match.home_team}`}>{match.home_team}</Link>
          {' '}{match.home_goals}-{match.home_behinds}-{match.home_score}
          {' '}vs <Link to={`/team/${match.away_team}`}>{match.away_team}</Link>
          {' '}{match.away_goals}-{match.away_behinds}-{match.away_score}
          {match.live ? liveText : ''}
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
    playerStats.sort((a, b) => a.player.jumper_number > b.player.jumper_number);
    return <TableContainer>
        <Table size='small'>
          <TableBody>
            {(new Array(8)).fill(null).map((_, i) => <TableRow key={i}>
                {playerStats.slice(3 * i, 3 * (i + 1)).map(x =>
                  <TableCell align='center' key={x.player.id}>
                    #{x.player.jumper_number}{' '}
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

function PlayerStatsTable ({ playerStats }) {
  if (!playerStats) {
    return;
  }
  const [order, setOrder] = useState('asc');
  const [orderBy, setOrderBy] = useState('jumper_number');
  const headCells = [
    {id: 'jumper_number', label: 'Number', left: true},
    {id: 'name', label: 'Name', left: true},
    {id: 'score', label: 'Score'},
    {id: 'disposals', label: 'Disposals'},
    {id: 'kicks', label: 'Kicks'},
    {id: 'handballs', label: 'Handballs'},
    {id: 'marks', label: 'Marks'},
    {id: 'tackles', label: 'Tackles'},
    {id: 'hitouts', label: 'Hitouts'},
  ];

  const getSurname = x => x.split('.').slice(-1)[0];
  const descendingComparator = (a, b, orderBy) => {
    let aValue, bValue;
    switch (orderBy) {
      case 'name':
        aValue = getSurname(a.player[orderBy]);
        bValue = getSurname(b.player[orderBy]);
        break;
      case 'jumper_number':
        aValue = a.player[orderBy];
        bValue = b.player[orderBy];
        break;
      case 'disposals':
        aValue = a.kicks + a.handballs;
        bValue = b.kicks + b.handballs;
        break
      case 'score':
        aValue = 6 * a.goals + a.behinds;
        bValue = 6 * b.goals + b.behinds;
        break
      default:
        aValue = a[orderBy];
        bValue = b[orderBy];
    }
    if (bValue < aValue) {
      return -1;
    }
    if (bValue > aValue) {
      return 1;
    }
    return 0;
  }
  
  const rows = useMemo(
    () => playerStats.sort((a, b) => order === 'desc'
        ? descendingComparator(a, b, orderBy)
        : -descendingComparator(a, b, orderBy)
    ),
    [order, orderBy],
  );
  return <TableContainer>
    <Table size='small'>
      <TableHead>
        <TableRow>
          {headCells.map(x => (
            <TableCell key={x.id} align={x.left ? 'left' : 'right'}
                sortDirection={orderBy === x.id ? order : false}>
              <TableSortLabel
                active={orderBy === x.id}
                direction={orderBy === x.id ? order : 'asc'}
                onClick={e => {
                  setOrder(orderBy === x.id && order === 'asc' ? 'desc' : 'asc');
                  setOrderBy(x.id);
                }}
              >{x.label} {orderBy === x.id ? (
                <Box component='span' sx={visuallyHidden}>
                  {order === 'desc' ? 'sorted descending' : 'sorted ascending'}
                </Box>
              ) : null}
              </TableSortLabel>
            </TableCell>
          ))}
          <TableCell align='right'>Frees (F/A)</TableCell>
        </TableRow>
      </TableHead>
      <TableBody>
        {rows.map(x => <TableRow
            key={'stats-' + x.player.id}
            sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
          >
            <TableCell align='right'>#{x.player.jumper_number}</TableCell>
            <TableCell><Link to={`/player/${x.player.id}`}>{x.player.name}</Link></TableCell>
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
  </TableContainer>
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
                  <PlayerStatsTable
                    playerStats={match.player_stats.filter(x => x.player.team == match.home_team)}
                  ></PlayerStatsTable>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={6}>
              <Card variant={'outlined'}>
                <CardContent>
                  <Typography variant='h5' component='div'>
                    <Link to={`/team/${match.away_team}`}>{match.away_team}</Link> (away)
                  </Typography>
                  <PlayerStatsTable
                    playerStats={match.player_stats.filter(x => x.player.team == match.away_team)}
                  ></PlayerStatsTable>
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