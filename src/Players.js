import { useState, useRef, useEffect } from 'react';
import Grid from'@mui/material/Grid';
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
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import Tooltip from '@mui/material/Tooltip';
import SvgIcon from '@mui/material/SvgIcon';
import { ArrowCircleDown, ArrowCircleUp, Cancel } from '@mui/icons-material';
import { Link, useSearchParams } from 'react-router-dom';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip as ChartJSTooltip,
  Legend,
} from 'chart.js';
import { Line } from 'react-chartjs-2';

import { apiRequester, BaseChartOptions, chartColours } from './helpers.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  ChartJSTooltip,
  Legend
);
const topChartOptions = new BaseChartOptions();
const bottomChartOptions = new BaseChartOptions();
const stats = ['games', 'goals', 'disposals', 'kicks', 'handballs', 'marks',
  'tackles', 'hitouts'];
const averageStats = ['disposals', 'kicks', 'handballs', 'marks', 'tackles',
  'hitouts'];

const renderPlayers = (players, onIconClick, bottomChartPlayers, topChartPlayers) => {
  const renderRow = x => (
    <TableRow
      key={x.id}
      sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
    >
      <TableCell><Link to={`/player/${x.id}`}>{x.name}</Link></TableCell>
      <TableCell align='right'>{x.season}</TableCell>
      <TableCell align='right'><Link to={`/team/${x.team}`}>{x.team}</Link></TableCell>
      <TableCell align='right'>{x.jumper_number}</TableCell>
      <Tooltip placement='left' title={bottomChartPlayers.includes(x.id)
          ? 'Remove from bottom chart' : 'Add to bottom chart'}>
        <TableCell>
          <SvgIcon onClick={e => onIconClick(x, 'bottom')}
            component={bottomChartPlayers.includes(x.id) ? Cancel : ArrowCircleDown}>
          </SvgIcon>
        </TableCell>
      </Tooltip>
      <Tooltip placement='right' title={topChartPlayers.includes(x.id) ?
          'Remove from top chart' : 'Add to top chart'}>
        <TableCell>
          <SvgIcon onClick={e => onIconClick(x, 'top')}
            component={topChartPlayers.includes(x.id) ? Cancel : ArrowCircleUp}>
          </SvgIcon>
        </TableCell>
      </Tooltip>
    </TableRow>
  )
  return <TableContainer>
    <Table size='small' style={{background: 'white'}} className='player-search-table'>
      <TableHead>
        <TableRow>
          <TableCell>Name</TableCell>
          <TableCell align='right'>Latest season</TableCell>
          <TableCell align='right'>Latest club</TableCell>
          <TableCell align='right'>Jumper number</TableCell>
          <TableCell></TableCell>
          <TableCell></TableCell>
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
  const [bottomChartData, setBottomChartData] = useState([]);
  const [bottomChartStat, setBottomChartStat] = useState('games');
  const [topChartData, setTopChartData] = useState([]);
  const [topChartStat, setTopChartStat] = useState('games');
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

  const togglePlayer = (player, chart) => {
    const chartData = chart === 'bottom' ? bottomChartData : topChartData;
    const setChartData = chart === 'bottom' ? setBottomChartData : setTopChartData;
    if (chartData.map(x => x[0].id).includes(player.id)) {
      setChartData(chartData.filter(x => x[0].id !== player.id));
    } else if (chartData.length < 6) {
      apiRequester({url: `/api/player/${player.id}`})
        .then(data => setChartData([...chartData, data]));
    }
  }

  const convertChartData = (baseChartData, stat) => {
    const newChartData = {labels: [], datasets: []};
    // First, set labels to the union of all seasons of selected players
    baseChartData.forEach(playerData => {
      playerData.map(x => x.season).forEach(season => {
        if (!newChartData.labels.includes(season)) {
          newChartData.labels.push(season);
          newChartData.labels.sort();
        }
      });
    });
    // Now set the actual data, with null for seasons missing from labels
    baseChartData.forEach((playerData, i) => {
      newChartData.datasets.push({
        label: playerData[0].name,
        data: newChartData.labels.map(season => {
          const data = playerData.find(x => x.season === season);
          if (!data) {
            return null;
          }
          if (stat === 'disposals') {
            return (data.kicks + data.handballs) / data.games;
          }
          if (averageStats.includes(stat)) {
            return data[stat] / data.games;
          }
          return data[stat];
        }),
        backgroundColor: chartColours[i],
      });
    });
    return newChartData;
  }

  return (
    <div className='app' onKeyDown={keyDown}>
    <Grid container spacing={2}>
      <Grid item xs={12} md={6}>
        <Card variant={'outlined'} style={{margin: '0 auto'}}>
          <CardContent>
            <TextField variant='standard'
              placeholder='Search players...'
              inputRef={inputRef}
              sx={{width: 'min(400px, 80vw)'}} />
          </CardContent>
        </Card>
        <Card variant={'outlined'} style={{margin: '20px auto 0 auto'}}>
          <CardContent>
            {players ? renderPlayers(players, togglePlayer,
              bottomChartData.map(x => x[0].id),
              topChartData.map(x => x[0].id)) : null}
            <Stack alignItems='center'>
              <Pagination
                page={page}
                count={Math.ceil(numPlayers / pageSize)}
                onChange={(e, page) => setPage(page)}/>
            </Stack>
          </CardContent>
        </Card>
      </Grid>
      <Grid item xs={12} md={6}>
        <Grid container spacing={2}>
          <Grid item xs={12}>
            <Card variant={'outlined'} className='chart-card'>
              <div style={{display: 'flex'}}>
                <FormControl sx={{ m: 1, minWidth: '80%' }}>
                  <InputLabel id='top-chart-label'>Statistic</InputLabel>
                  <Select
                    labelId='top-chart-label'
                    value={topChartStat}
                    label='Statistic'
                    onChange={e => setTopChartStat(e.target.value)}
                  >
                    {stats.map(x => <MenuItem
                      key={'top-chart-' + x}
                      value={x}
                    >{x}</MenuItem>)}
                  </Select>
                </FormControl>
                <Tooltip title='Reset chart'>
                  <Cancel onClick={e => setTopChartData([])}></Cancel>
                </Tooltip>
              </div>
              <div className='chart-wrapper'>
                {topChartData.length ? <Line options={topChartOptions}
                  data={convertChartData(topChartData, topChartStat)} />
                  : <span>Select a player to add to the chart!</span>}
              </div>
            </Card>
          </Grid>
          <Grid item xs={12}>
            <Card variant={'outlined'} className='chart-card'>
              <div style={{display: 'flex'}}>
                <FormControl sx={{ m: 1, minWidth: '80%' }}>
                  <InputLabel id='bottom-chart-label'>Statistic</InputLabel>
                  <Select
                    labelId='bottom-chart-label'
                    value={bottomChartStat}
                    label='Statistic'
                    onChange={e => setBottomChartStat(e.target.value)}
                  >
                    {stats.map(x => <MenuItem
                      key={'bottom-chart-' + x}
                      value={x}
                    >{x}</MenuItem>)}
                  </Select>
                </FormControl>
                <Tooltip title='Reset chart'>
                  <Cancel onClick={e => setBottomChartData([])}></Cancel>
                </Tooltip>
              </div>
              <div className='chart-wrapper'>
                {bottomChartData.length ? <Line options={bottomChartOptions}
                  data={convertChartData(bottomChartData, bottomChartStat)} />
                  : <span>Select a player to add to the chart!</span>}
              </div>
            </Card>
          </Grid>
        </Grid>
      </Grid>
    </Grid>
    </div>
  );
};

export default Players;