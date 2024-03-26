import { useState, useRef, useEffect } from 'react';
import TextField from'@mui/material/TextField';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Pagination from '@mui/material/Pagination';
import Stack from '@mui/material/Stack';
import { Link, useSearchParams } from 'react-router-dom';

import { apiRequester } from './helpers.js';

const renderPlayers = players => {
  const renderRow = row => (
    <TableRow
      key={row.id}
      sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
    >
      <TableCell><Link to={`/player/${row.id}`}>{row.name}</Link></TableCell>
      <TableCell align='right'>{row.season}</TableCell>
      <TableCell align='right'><Link to={`/team/${row.team}`}>{row.team}</Link></TableCell>
      <TableCell align='right'>{row.jumper_number}</TableCell>
    </TableRow>
  )
  return <TableContainer>
    <Table size='small' style={{background: 'white'}}>
      <TableHead>
        <TableRow>
          <TableCell>Name</TableCell>
          <TableCell align='right'>Latest season</TableCell>
          <TableCell align='right'>Latest club</TableCell>
          <TableCell align='right'>Jumper number</TableCell>
        </TableRow>
      </TableHead>
      <TableBody>
        {players.map(x => renderRow(x))}
      </TableBody>
    </Table>
  </TableContainer>
}

function Players() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [players, setPlayers] = useState([]);
  const inputRef = useRef(null);
  const pageSize = 18;
  const [page, setPage] = useState(1);
  const [numPlayers, setNumPlayers] = useState(1);

  // Helper for running a search
  const submitSearch = (searchStr, page) => {
    if (!searchStr) {
      return;
    }
    page = Number(page || 1);
    const url = `/api/players/${searchStr}?page_size=${pageSize}&page=${page}`;
    apiRequester({url: url}).then(data => {
      setPlayers(data);
      setNumPlayers(JSON.parse(data._headers.get('x-pagination')).total);
      setSearchParams({page: page, search_str: searchStr});
      setPage(page);
    });
  }

  // Observer for enter key being pressed
  const keyDown = e => {
    if (e.keyCode == 13) {
      submitSearch(inputRef.current.value, 1);
   }
  }

  // Observer for page being changed
  useEffect(() => {
    submitSearch(inputRef.current.value || searchParams.get('search_str'), page);
  }, [page]);

  // Run a search on page load if search_str is in the URL
  useEffect(() => {
    submitSearch(searchParams.get('search_str'), searchParams.get('page'));
  }, []);

  return (
    <div className='app' style={{flexDirection: 'column'}} onKeyDown={keyDown}>
      <Card variant={'outlined'} style={{margin: '0 auto'}}>
        <CardContent>
          <TextField variant='standard'
            placeholder='Search players...'
            inputRef={inputRef}
            sx={{width: 'min(400px, 80vw)'}} />
        </CardContent>
      </Card>
      <Card variant={'outlined'} style={{margin: '20px auto 0 auto', width: 'min(1200px, 80vw)'}}>
        <CardContent>
          {players ? renderPlayers(players) : null}
          <Stack alignItems='center'>
            <Pagination
              page={page}
              count={Math.ceil(numPlayers / pageSize)}
              onChange={(e, page) => setPage(page)}/>
          </Stack>
        </CardContent>
      </Card>
    </div>
  );
};

export default Players;