import { useState, useRef } from 'react';
import TextField from'@mui/material/TextField';
import Grid from '@mui/material/Grid';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import { Link } from 'react-router-dom';

import { apiRequester } from './helpers.js';

const renderPlayer = player => {
  return <Grid item xs={6} sm={4} md={3} key={player.id}>
    <Card variant={'outlined'} className='team-card'>
      <CardContent>
        <Typography gutterBottom variant='h5' component='div'>
          <Link to={`/player/${player.id}`}>{player.name}</Link>
        </Typography>
        <Typography variant='body2' color='text.secondary'>
          <Link to={`/team/${player.team}`}>{player.team}</Link>, {' '}
          #{player.jumper_number}
        </Typography>
      </CardContent>
    </Card>
  </Grid>
}

function Players() {
  const [players, setPlayers] = useState([]);
  const inputRef = useRef(null);
  const keyDown = e => {
    // Search when enter is pressed
    if (e.keyCode == 13) {
      submitSearch();
   }
  }
  const submitSearch = () => {
    const searchString = inputRef.current.value;
    if (!searchString) {
      return;
    }
    const playersrUrl = `/api/players/${searchString}`;
    apiRequester({url: playersrUrl})
      .then(data => setPlayers(data));
  }
  return (
    <div className='app' onKeyDown={keyDown}>
      <div className='players-container'>
        <Card variant={'outlined'} style={{width: '400px', margin: 'auto'}}>
          <CardContent>
            <TextField variant='standard' placeholder='Search players...' inputRef={inputRef} />
            <Button onClick={submitSearch}>Search</Button>
          </CardContent>
        </Card>
        <Grid container spacing={2}>
          {players.map(player => renderPlayer(player))}
        </Grid>
      </div>
    </div>
  );
};

export default Players;