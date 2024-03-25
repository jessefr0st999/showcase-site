import { useState, useEffect } from 'react';
import Grid from'@mui/material/Grid';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import { Link } from 'react-router-dom';

import { apiRequester, getOrdinal } from './helpers.js';

const currentLadderUrl = '/api/current_ladder';

const renderTeam = ladder => {
  return <Grid item xs={6} sm={4} md={3} key={ladder.team}>
    <Card variant={'outlined'} className='team-card'>
      <CardContent>
        <Typography gutterBottom variant='h5' component='div'>
          <Link to={`/team/${ladder.team}`}>{ladder.team}</Link>
        </Typography>
        <Typography variant='body2' color='text.secondary'>
          2024: {getOrdinal(ladder.pos)} ({ladder.wins} wins, {ladder.losses} losses, {ladder.draws} draws)
        </Typography>
      </CardContent>
    </Card>
  </Grid>
}

function Teams() {
  const [currentLadder, setCurrentLadder] = useState([]);
  useEffect(() => {
    apiRequester({url: currentLadderUrl})
      .then(data => {
        data.forEach((ladder, i) => ladder.pos = i + 1);
        data.sort((a, b) => a.team.localeCompare(b.team));
        setCurrentLadder(data);
      })
  }, []);
  return (
    <div className='app'>
      <Grid container spacing={2}>
        {currentLadder.map(team => renderTeam(team))}
      </Grid>
    </div>
  );
};

export default Teams;