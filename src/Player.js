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
  plugins = {
    legend: {
      position: 'top',
    },
    title: {
      display: true,
      text: 'Chart.js Bar Chart',
    },
  }
}
const chartColours = ['red', 'blue', 'green', 'grey']
const BaseChartData = class {
  labels = [];
  datasets = ['goals', 'disposals', 'marks', 'tackles'].map((x, i) => ({
    label: x,
    data: [],
    backgroundColor: chartColours[i],
  }))
}
const seasonChartOptions = new BaseChartOptions();
const recentChartOptions = new BaseChartOptions();
seasonChartOptions.plugins.title.text = 'Stats by season';
recentChartOptions.plugins.title.text = 'Recent stats';

const renderPlayerInfo = seasonStats => {
  return <Card variant={'outlined'}>
    <CardContent>
      <Typography variant='h5' component='div'>
        {seasonStats[0].name}{' '}(<Link to={`/team/${seasonStats[0].team}`}>
          {seasonStats[0].team}</Link>, #{seasonStats[0].jumper_number})
      </Typography>
      <Typography variant='body' component='div'>
        {seasonStats[0].season} season overview:
      </Typography>
      <Typography variant='body2' component='div'>
        {seasonStats[0].games} games, {' '}
        {seasonStats[0].goals} goals, {' '}
        {seasonStats[0].kicks + seasonStats[0].handballs} disposals, {' '}
        {seasonStats[0].kicks} kicks, {' '}
        {seasonStats[0].handballs} handballs, {' '}
        {seasonStats[0].marks} marks, {' '}
        {seasonStats[0].tackles} tackles
      </Typography>
    </CardContent>
  </Card>
}

const renderMatchHistory = recentStats => {
  return <Card variant={'outlined'}>
    <CardContent>
      <Typography variant='h5' component='div'>
        Last 5 matches
      </Typography>
      <TableContainer>
        <Table size='small' style={{background: 'white'}}>
          <TableHead>
            <TableRow>
              <TableCell></TableCell>
              <TableCell align='right'>Goals</TableCell>
              <TableCell align='right'>Disposals</TableCell>
              <TableCell align='right'>Kicks</TableCell>
              <TableCell align='right'>Handballs</TableCell>
              <TableCell align='right'>Marks</TableCell>
              <TableCell align='right'>Tackles</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {recentStats.slice(0, 5).map(x => <TableRow
                key={x.match.id}
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
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </CardContent>
  </Card>
}

function Player() {
  const { playerId } = useParams();
  const seasonStatsUrl = `/api/player/${playerId}`;
  const recentStatsUrl = `/api/stats_by_player/${playerId}`;
  const [seasonStats, setSeasonStats] = useState(null);
  const [recentStats, setRecentStats] = useState(null);
  const [seasonChartData, setSeasonChartData] = useState(null);
  const [recentChartData, setRecentChartData] = useState(null);
  useEffect(() => {
    const seasonStatsPromise = apiRequester({url: seasonStatsUrl});
    const recentStatsPromise = apiRequester({url: recentStatsUrl});
    Promise.all([seasonStatsPromise, recentStatsPromise]).then(values => {
      setSeasonStats(values[0]);
      setRecentStats(values[1]);
      let _seasonChartData = new BaseChartData()
      let _recentChartData = new BaseChartData()
      values[0].toReversed().forEach((x, i) => {
        _seasonChartData.labels[i] = x.season;
        _seasonChartData.datasets[0].data[i] = x.goals;
        _seasonChartData.datasets[1].data[i] = (x.kicks + x.handballs) / x.games;
        _seasonChartData.datasets[2].data[i] = x.marks / x.games;
        _seasonChartData.datasets[3].data[i] = x.tackles / x.games;
      })
      values[1].toReversed().forEach((x, i) => {
        _recentChartData.labels[i] = `${getRoundName(x.season, x.match.round, true)} ${x.season}`;
        _recentChartData.datasets[0].data[i] = x.goals;
        _recentChartData.datasets[1].data[i] = (x.kicks + x.handballs);
        _recentChartData.datasets[2].data[i] = x.marks;
        _recentChartData.datasets[3].data[i] = x.tackles;
      })
      setSeasonChartData(_seasonChartData);
      setRecentChartData(_recentChartData);
    });
  }, []);
  return (
    <div className='app'>
      {seasonStats ? <Grid container spacing={2}>
        <Grid item xs={12} md={6}>{renderPlayerInfo(seasonStats)}</Grid>
        <Grid item xs={12} md={6}>{renderMatchHistory(recentStats)}</Grid>
        <Grid item xs={12} md={6}>
          <Card variant={'outlined'}>
            <Line options={seasonChartOptions} data={seasonChartData} />
          </Card>
        </Grid>
        <Grid item xs={12} md={6}>
          <Card variant={'outlined'}>
            <Line options={recentChartOptions} data={recentChartData} />
          </Card>
        </Grid>
      </Grid> : null}
    </div>
  );
};

export default Player;