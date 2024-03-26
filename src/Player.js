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
import Stack from '@mui/material/Stack';
import { useParams, Link } from 'react-router-dom';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Line } from 'react-chartjs-2';

import { apiRequester, getRoundName } from './helpers.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);
const BaseChartOptions = class {
  responsive = true;
  maintainAspectRatio = false;
  plugins = {
    legend: {
      position: 'top',
    },
  }
}
const chartColours = ['red', 'blue', 'gold', 'green', 'orange', 'cyan', 'magenta'];
const visibleDatasets = ['disposals', 'marks', 'tackles', 'hitouts'];
const hiddenDatasets = ['kicks', 'handballs', 'goals'];
const BaseChartData = class {
  labels = [];
  datasets = [...visibleDatasets, ...hiddenDatasets].map((x, i) => ({
    label: x,
    data: [],
    backgroundColor: chartColours[i],
    hidden: hiddenDatasets.includes(x),
  }));
}
const seasonChartOptions = new BaseChartOptions();
const recentChartOptions = new BaseChartOptions();

const renderPlayerHistory = seasonStats => {
  return <Card variant={'outlined'}>
    <CardContent>
      <TableContainer>
        <Table size='small'>
          <TableHead>
            <TableRow>
              <TableCell>Season</TableCell>
              <TableCell align='right'>Club</TableCell>
              <TableCell align='right'>Jumper number</TableCell>
              <TableCell align='right'>Games</TableCell>
              <TableCell align='right'>Goals</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {seasonStats.map(x => <TableRow
                key={'player-' + x.season}
                sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
              >
                <TableCell>{x.season}</TableCell>
                <TableCell align='right'><Link to={`/team/${x.team}`}>{x.team}</Link></TableCell>
                <TableCell align='right'>{x.jumper_number}</TableCell>
                <TableCell align='right'>{x.games}</TableCell>
                <TableCell align='right'>{x.goals}</TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </CardContent>
  </Card>
}

function MatchHistory({recentStats, page, count, onPaginationChange}) {
  return <Card variant={'outlined'} className='match-history-card'>
    <CardContent>
      <TableContainer>
        <Table size='small'>
          <TableHead>
            <TableRow>
              <TableCell></TableCell>
              <TableCell align='right'>Goals</TableCell>
              <TableCell align='right'>Disposals</TableCell>
              <TableCell align='right'>Kicks</TableCell>
              <TableCell align='right'>Handballs</TableCell>
              <TableCell align='right'>Marks</TableCell>
              <TableCell align='right'>Tackles</TableCell>
              <TableCell align='right'>Hitouts</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {recentStats.map(x => <TableRow
                key={'match-' + x.match.id}
                sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
              >
                <TableCell><Link to={`/match/${x.match.id}`}>
                  {getRoundName(x.season, x.match.round, false)} {x.season}
                </Link></TableCell>
                <TableCell align='right'>{x.goals}</TableCell>
                <TableCell align='right'>{x.kicks + x.handballs}</TableCell>
                <TableCell align='right'>{x.kicks}</TableCell>
                <TableCell align='right'>{x.handballs}</TableCell>
                <TableCell align='right'>{x.marks}</TableCell>
                <TableCell align='right'>{x.tackles}</TableCell>
                <TableCell align='right'>{x.hitouts}</TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>
      <Stack alignItems='center'>
        <Pagination
          page={page}
          count={count}
          onChange={onPaginationChange}/>
      </Stack>
    </CardContent>
  </Card>
}

function Player() {
  const { playerId } = useParams();
  const pageSize = 10;
  const seasonStatsUrl = `/api/player/${playerId}`;
  const recentStatsBaseUrl = `/api/stats_by_player/${playerId}`;
  const [seasonStats, setSeasonStats] = useState(null);
  const [recentStats, setRecentStats] = useState(null);
  const [page, setPage] = useState(1);
  const [numMatches, setNumMatches] = useState(1);
  useEffect(() => {
    const url = `${recentStatsBaseUrl}?page_size=${pageSize}&page=${page}`;
    apiRequester({url: url}).then(data => setRecentStats(data));
  }, [page]);

  const [seasonChartData, setSeasonChartData] = useState(null);
  const [recentChartData, setRecentChartData] = useState(null);
  useEffect(() => {
    const seasonStatsPromise = apiRequester({url: seasonStatsUrl});
    const recentStatsPromise = apiRequester({url: `${recentStatsBaseUrl}?page_size=25`});
    Promise.all([seasonStatsPromise, recentStatsPromise]).then(values => {
      setSeasonStats(values[0]);
      setRecentStats(values[1].slice(0, pageSize));
      setNumMatches(JSON.parse(values[1]._headers.get('x-pagination')).total);
      let _seasonChartData = new BaseChartData()
      let _recentChartData = new BaseChartData()
      // Label all except goals as average
      _seasonChartData.datasets.slice(0, -1).forEach(x => x.label = `av. ${x.label}`);
      _seasonChartData.datasets.unshift({
        label: 'games',
        data: [],
        backgroundColor: 'black',
        hidden: true,
      })
      values[0].toReversed().forEach((x, i) => {
        _seasonChartData.labels[i] = x.season;
        _seasonChartData.datasets[0].data[i] = x.games;
        _seasonChartData.datasets[1].data[i] = (x.kicks + x.handballs) / x.games;
        _seasonChartData.datasets[2].data[i] = x.marks / x.games;
        _seasonChartData.datasets[3].data[i] = x.tackles / x.games;
        _seasonChartData.datasets[4].data[i] = x.hitouts / x.games;
        _seasonChartData.datasets[5].data[i] = x.kicks / x.games;
        _seasonChartData.datasets[6].data[i] = x.handballs / x.games;
        _seasonChartData.datasets[7].data[i] = x.goals;
      })
      values[1].toReversed().forEach((x, i) => {
        _recentChartData.labels[i] = `${getRoundName(x.season, x.match.round, true)} ${x.season}`;
        _recentChartData.datasets[0].data[i] = (x.kicks + x.handballs);
        _recentChartData.datasets[1].data[i] = x.marks;
        _recentChartData.datasets[2].data[i] = x.tackles;
        _recentChartData.datasets[3].data[i] = x.hitouts;
        _recentChartData.datasets[4].data[i] = x.kicks;
        _recentChartData.datasets[5].data[i] = x.handballs;
        _recentChartData.datasets[6].data[i] = x.goals;
      })
      setSeasonChartData(_seasonChartData);
      setRecentChartData(_recentChartData);
    });
  }, []);

  return (
    <div className='app' style={{flexDirection: 'column'}}>
      {seasonStats ? <>
        <h1>{seasonStats[0].name}</h1>
        <Grid container spacing={2}>
          <Grid item xs={12} md={6}>
            <Card variant={'outlined'} className='chart-card'>
              <Typography variant='h5'>
                Stats by season
              </Typography>
              <div>
                <Line options={seasonChartOptions} data={seasonChartData} />
              </div>
            </Card>
          </Grid>
          <Grid item xs={12} md={6}>
            <Card variant={'outlined'} className='chart-card'>
              <Typography variant='h5'>
                Recent stats
              </Typography>
              <div>
                <Line options={recentChartOptions} data={recentChartData} />
              </div>
            </Card>
          </Grid>
          <Grid item xs={12} md={6}>
            {renderPlayerHistory(seasonStats)}
          </Grid>
          <Grid item xs={12} md={6}>
            <MatchHistory
              recentStats={recentStats}
              page={page}
              count={Math.ceil(numMatches / pageSize)}
              onPaginationChange={(e, page) => setPage(page)}
            ></MatchHistory>
          </Grid>
        </Grid>
      </> : null}
    </div>
  );
};

export default Player;