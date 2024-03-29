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
import Pagination from '@mui/material/Pagination';
import Stack from '@mui/material/Stack';
import { useParams, Link } from 'react-router-dom';
import useWebSocket, { ReadyState } from 'react-use-websocket';

import { apiRequester } from './helpers.js';
import { WEBSOCKET_URI } from './secrets.js';
import { MatchCard } from './Home.js';

function Matches({matches, page, count, onPaginationChange, animatedIds, stopAnimation}) {
  return <>
    <Grid container spacing={2}>
      {matches?.map(match =>
        <MatchCard match={match} key={match.id}
          animatedIds={animatedIds}
          stopAnimation={stopAnimation}
        ></MatchCard>
      )}
      <Grid item xs={12} key={'pagination'}>
        <Card>
          <CardContent>
            <Stack alignItems='center'>
              <Pagination
                page={page}
                count={count}
                onChange={onPaginationChange}/>
            </Stack>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  </>
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
  return <Card>
    <CardContent>
      <TableContainer>
        <Table size='small' style={{background: 'white'}}>
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
    </CardContent>
  </Card>
}

function Team() {
  const [animatedIds, setAnimatedIds] = useState([]);
  const stopAnimation = id => setAnimatedIds(animatedIds?.filter(x => x !== id));

  const { teamName } = useParams();
  const pageSize = 6;
  const matchesBaseUrl = `/api/matches_by_team/${teamName}?page_size=${pageSize}`;
  const playersUrl = `/api/players_by_team/${teamName}`;
  const [matches, setMatches] = useState([]);
  const [players, setPlayers] = useState([]);
  const [page, setPage] = useState(1);
  const [numMatches, setNumMatches] = useState(1);
  useEffect(() => {
    apiRequester({url: `${matchesBaseUrl}&page=${page}`})
      .then(data => {
        setMatches(data);
        setNumMatches(JSON.parse(data._headers.get('x-pagination')).total);
      });
  }, [page]);
  useEffect(() => {
    apiRequester({url: playersUrl})
      .then(data => setPlayers(data))
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
    const indexToUpdate = matches.findIndex(x => x.id === lastJsonMessage.id);
    if (indexToUpdate !== -1) {
      // Update an existing match
      const newMatches = [...matches];
      newMatches[indexToUpdate] = lastJsonMessage;
      setMatches(newMatches);
      setAnimatedIds([...animatedIds, lastJsonMessage.id]);
    }
  }, [lastJsonMessage]);

  return (
    <div className='app' style={{flexDirection: 'column'}}>
      <h1>{teamName}</h1>
      <Grid container spacing={2}>
        <Grid item xs={12} md={8}>
          <Matches
            matches={matches}
            page={page}
            count={Math.ceil(numMatches / pageSize)}
            onPaginationChange={(e, page) => setPage(page)}
            animatedIds={animatedIds}
            stopAnimation={stopAnimation}
          ></Matches>
        </Grid>
        <Grid item xs={12} md={4}>{renderPlayers(players)}</Grid>
      </Grid>
    </div>
  );
};

export default Team;