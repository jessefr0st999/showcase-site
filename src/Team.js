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
import { CardActionArea } from '@mui/material';
import { useParams, Link } from 'react-router-dom';

import { apiRequester, getRoundName } from './helpers.js';

const renderMatches = matches => {
  return <div className='matches-container'>
    {matches?.map(match =>
      <Card variant={'outlined'} key={match.id}>
        <CardContent>
          <Typography gutterBottom variant='h5' component='div'>
            {getRoundName(match.season, match.round, false)}
          </Typography>
          <Typography variant='body2' color='text.secondary'>
            <Link to={`/match/${match.id}`}>
              {`${match.home_team} vs ${match.away_team}`}, {match.location}
            </Link>
          </Typography>
        </CardContent>
      </Card>
    )}
  </div>
}

const renderPlayers = players => {
  const renderRow = row => (
    <TableRow
      key={row.id}
      sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
    >
      <TableCell><Link to={`/player/${row.id}`}>{row.name}</Link></TableCell>
      <TableCell align='right'>{row.jumper_number}</TableCell>
    </TableRow>
  )
  return <div className='ladder-container'>
    <TableContainer>
      <Table sx={{ minWidth: 400 }} size='small' style={{background: 'white'}}>
        <TableHead>
          <TableRow>
            <TableCell>Name</TableCell>
            <TableCell align='right'>Jumper number</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {players.map(x => renderRow(x))}
        </TableBody>
      </Table>
    </TableContainer>
  </div>
}

function Team() {
  const { teamName } = useParams();
  const currentYear = (new Date()).getFullYear();
  const matchesUrl = `/api/matches_by_team/${currentYear}/${teamName}`;
  const playersUrl = `/api/players_by_team/${teamName}`;
  const [matches, setMatches] = useState([]);
  const [players, setPlayers] = useState([]);
  useEffect(() => {
    apiRequester({url: matchesUrl})
      .then(data => setMatches(data))
  }, []);
  useEffect(() => {
    apiRequester({url: playersUrl})
      .then(data => setPlayers(data))
  }, []);
  return (
    <div className='app' style={{flexDirection: 'column'}}>
      <h1>{teamName}</h1>
      <Grid container spacing={2}>
        <Grid item xs={12} md={6}>{renderMatches(matches)}</Grid>
        <Grid item xs={12} md={6}>{renderPlayers(players)}</Grid>
      </Grid>
    </div>
  );
};

export default Team;