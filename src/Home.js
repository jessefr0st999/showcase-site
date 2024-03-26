import { useState, useEffect } from 'react';
import Grid from'@mui/material/Grid';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Typography from '@mui/material/Typography';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import { Link } from 'react-router-dom';

import { apiRequester, calculateAverage, getRoundName } from './helpers.js';

const currentMatchesUrl = '/api/current_matches';
const matchesBaseUrl = '/api/matches_by_round';
const currentLadderUrl = '/api/current_ladder';
const randomPlayerUrl = '/api/random_player';
const dataSpanUrl = '/api/data_span';

function Matches({matches, seasonList, roundList, season, round, onSeasonChange, onRoundChange}) {
  return <Grid container spacing={2}>
    <Grid item xs={12}><Card><CardContent>
      {seasonList && roundList && season && (round || round === 0) ? <>
        <FormControl sx={{ m: 1, minWidth: '45%' }}>
          <InputLabel id='season-select-label'>Season</InputLabel>
          <Select
            labelId='season-select-label'
            value={season}
            label='Season'
            onChange={onSeasonChange}
            
          >
            {seasonList.map(x => <MenuItem
              key={'season-' + x}
              value={x}
            >{x}</MenuItem>)}
          </Select>
        </FormControl>
        <FormControl sx={{ m: 1, minWidth: '45%' }}>
          <InputLabel id='round-select-label'>Round</InputLabel>
          <Select
            labelId='round-select-label'
            value={round}
            label='Round'
            onChange={onRoundChange}
          >
            {roundList.map(x => <MenuItem
              key={'round-' + x}
              value={x}
            >{getRoundName(season, x)}</MenuItem>)}
          </Select>
        </FormControl>
      </> : null}
    </CardContent></Card></Grid>
    {matches.map(match =>
      <Grid item xs={12} key={match.id}>
        <Card variant={'outlined'} className='match-card'>
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
      </Grid>
    )}
  </Grid>
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
          <TableContainer>
            <Table sx={{ minWidth: 400 }} size='small' style={{background: 'white'}}>
              <TableHead>
                <TableRow>
                  <TableCell></TableCell>
                  <TableCell align='right'>Games</TableCell>
                  <TableCell align='right'>Goals</TableCell>
                  <TableCell align='right'>Av. disposals</TableCell>
                  <TableCell align='right'>Av. kicks</TableCell>
                  <TableCell align='right'>Av. handballs</TableCell>
                  <TableCell align='right'>Av. marks</TableCell>
                  <TableCell align='right'>Av. tackles</TableCell>
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
                    <TableCell align='right'>{x.goals}</TableCell>
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
        </CardContent>
      </Card>
    : null}
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
  return <Card>
    <CardContent>
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
            <TableRow className='ladder-divider'>
              {Array(6).fill(null).map((_, i) => <TableCell key={i}></TableCell>)}
            </TableRow>
            {ladder.slice(8).map((x, pos) => renderRow(x, pos + 8))}
          </TableBody>
        </Table>
      </TableContainer>
    </CardContent>
  </Card>
}

function Home() {
  const [matches, setMatches] = useState([]);
  const [season, setSeason] = useState(null);
  const [round, setRound] = useState(null);
  const [seasonList, setSeasonList] = useState(null);
  const [roundList, setRoundList] = useState(null);
  const [dataSpan, setDataSpan] = useState(null);
  useEffect(() => {
    apiRequester({url: currentMatchesUrl})
      .then(data => {
        setMatches(data);
        setSeason(data[0].season);
        setRound(data[0].round);
      })
  }, []);
  useEffect(() => {
    apiRequester({url: dataSpanUrl})
      .then(data => {
        const {min_round, max_round} = data.slice(-1)[0];
        setSeasonList(data.map(x => x.season));
        setRoundList([...Array(max_round + 1 - min_round).keys()].map(x => x + min_round));
        setDataSpan(data);
      })
  }, []);
  useEffect(() => {
    if (season && (round || round === 0)) {
      apiRequester({url: `${matchesBaseUrl}/${season}/${round}`})
        .then(data => setMatches(data))
    }
  }, [season, round]);
  
  const [currentLadder, setCurrentLadder] = useState([]);
  useEffect(() => {
    apiRequester({url: currentLadderUrl})
      .then(data => setCurrentLadder(data))
  }, []);
  
  const [randomPlayer, setRandomPlayer] = useState(null);
  useEffect(() => {
    apiRequester({url: randomPlayerUrl})
      .then(data => setRandomPlayer(data))
  }, []);

  return (
    <div className='app'>
      <Grid container spacing={2}>
        <Grid item xs={12} md={6}>
          {matches.length ? <h1 style={{marginTop: 0}}>
            {getRoundName(matches[0].season, matches[0].round, false)} {matches[0].season}
          </h1> : null}
          <Matches
            matches={matches}
            seasonList={seasonList}
            roundList={roundList}
            season={season}
            round={round}
            onSeasonChange={e => {
              const newSeason = e.target.value;
              const {min_round, max_round} = dataSpan.find(x => x.season === newSeason);
              setSeason(newSeason);
              setRoundList([...Array(max_round + 1 - min_round).keys()].map(x => x + min_round));
            }}
            onRoundChange={e => setRound(e.target.value)}
          ></Matches>
        </Grid>
        <Grid item xs={12} md={6}>
          <Grid container spacing={2}>
            <Grid item xs={12}>{renderRandomPlayer(randomPlayer)}</Grid>
            <Grid item xs={12}>{renderLadder(currentLadder)}</Grid>
          </Grid>
        </Grid>
      </Grid>
    </div>
  );
}

export default Home;