import { useState, useEffect } from 'react';
import Grid from'@mui/material/Grid';
import Card from '@mui/material/Card';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import Pagination from '@mui/material/Pagination';
import { Link } from 'react-router-dom';

import { apiRequester, calculateAverage } from './helpers.js';

const currentMatchesUrl = '/api/current_matches';
const currentLadderUrl = '/api/current_ladder';
const randomPlayerUrl = '/api/random_player';

const renderMatches = matches => {
  return <div className='matches-container'>
    {matches.map(match =>
      <Card variant={'outlined'} key={match.id}>
        <CardContent>
          <Typography gutterBottom variant='h5' component='div'>
            <Link to={`/match/${match.id}`}>
              {`${match.home_team} ${match.home_goals}-${match.home_behinds}-${match.home_score}
                vs ${match.away_team} ${match.away_goals}-${match.away_behinds}-${match.away_score}`}
            </Link>
          </Typography>
          <Typography variant='body2' color='text.secondary'>
            {match.location}
          </Typography>
        </CardContent>
      </Card>
    )}
  </div>
}

const renderLadder = ladder => {
  const renderRow = (row, pos) => (
    <TableRow
      key={pos}
      sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
    >
      <TableCell><Link to={`/team/${row.team}`}>{pos + 1}) {row.team}</Link></TableCell>
      <TableCell align='right'>{row.wins}</TableCell>
      <TableCell align='right'>{row.losses}</TableCell>
      <TableCell align='right'>{row.draws}</TableCell>
      <TableCell align='right'>{row.ladder_points}</TableCell>
      <TableCell align='right'>{Math.round(row.percent * 10, 2) / 10}%</TableCell>
    </TableRow>
  )
  return <div className='ladder-container'>
    <TableContainer>
      <Table sx={{ minWidth: 400 }} size='small' style={{background: 'white'}}>
        <TableHead>
          <TableRow>
            <TableCell>Team</TableCell>
            <TableCell align='right'>Wins</TableCell>
            <TableCell align='right'>Losses</TableCell>
            <TableCell align='right'>Draws</TableCell>
            <TableCell align='right'>Points</TableCell>
            <TableCell align='right'>Percentage</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {ladder.slice(0, 8).map((x, pos) => renderRow(x, pos))}
          <TableRow>
            <TableCell></TableCell>
            <TableCell></TableCell>
            <TableCell></TableCell>
            <TableCell></TableCell>
            <TableCell></TableCell>
            <TableCell></TableCell>
          </TableRow>
          {ladder.slice(8).map((x, pos) => renderRow(x, pos + 8))}
        </TableBody>
      </Table>
    </TableContainer>
  </div>
}

const renderRandomPlayer = randomPlayer => {
  return <div className='player-container'>
    {randomPlayer ?
      <Card variant={'outlined'}>
        <CardContent>
          <Typography gutterBottom variant='h5' component='div'>
            Random player:{' '}
            <Link to={`/player/${randomPlayer[0].id}`}>
              {randomPlayer[0].name}
            </Link>
            {' '}({randomPlayer[0].team}, #{randomPlayer[0].jumper_number})
          </Typography>
        </CardContent>
        <TableContainer>
          <Table sx={{ minWidth: 400 }} size='small' style={{background: 'white'}}>
            <TableHead>
              <TableRow>
                <TableCell></TableCell>
                <TableCell align='right'>Games</TableCell>
                <TableCell align='right'>Goals</TableCell>
                <TableCell align='right'>Disposals</TableCell>
                <TableCell align='right'>Kicks</TableCell>
                <TableCell align='right'>Handballs</TableCell>
                <TableCell align='right'>Marks</TableCell>
                <TableCell align='right'>Tackles</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {randomPlayer.map(x => (
                <TableRow
                  key={x.season}
                  sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
                >
                  <TableCell>{x.season}</TableCell>
                  <TableCell align='right'>{x.games}</TableCell>
                  <TableCell align='right'>{calculateAverage('goals', x)}</TableCell>
                  <TableCell align='right'>{calculateAverage('disposals', x)}</TableCell>
                  <TableCell align='right'>{calculateAverage('kicks', x)}</TableCell>
                  <TableCell align='right'>{calculateAverage('handballs', x)}</TableCell>
                  <TableCell align='right'>{calculateAverage('marks', x)}</TableCell>
                  <TableCell align='right'>{calculateAverage('tackles', x)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>
    : null}
  </div>
}

function Home() {
  const [currentMatches, setCurrentMatches] = useState([]);
  const [currentLadder, setCurrentLadder] = useState([]);
  const [randomPlayer, setRandomPlayer] = useState(null);
  useEffect(() => {
    apiRequester({url: currentMatchesUrl})
      .then(data => setCurrentMatches(data))
  }, []);
  useEffect(() => {
    apiRequester({url: currentLadderUrl})
      .then(data => setCurrentLadder(data))
  }, []);
  useEffect(() => {
    apiRequester({url: randomPlayerUrl})
      .then(data => setRandomPlayer(data))
  }, []);
  return (
    <div className='app'>
      <Grid container spacing={2}>
        <Grid item xs={12} md={6}>{renderMatches(currentMatches)}</Grid>
        <Grid container item xs={12} md={6} spacing={2}>
          <Grid item xs={12}>{renderRandomPlayer(randomPlayer)}</Grid>
          <Grid item xs={12}>{renderLadder(currentLadder)}</Grid>
        </Grid>
      </Grid>
    </div>
  );
}

export default Home;