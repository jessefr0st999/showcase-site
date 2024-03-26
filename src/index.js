import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route, Outlet, NavLink } from 'react-router-dom';
import { AppBar, Toolbar, Typography } from '@mui/material';
import { createTheme, ThemeProvider } from '@mui/material/styles';

import Home from './Home';
import NoPage from './NoPage';
import Teams from './Teams';
import Players from './Players';
import Team from './Team';
import Match from './Match';
import Player from './Player';
import About from './About';
import './index.css';

function Menu() {
  return <AppBar position='static'>
    <Toolbar>
      <img src='/images/footy-charts-high-resolution-logo-white-transparent.png' height='50px' />
      <Typography variant='h6'><NavLink to='/'>Home</NavLink></Typography>
      <Typography variant='h6'><NavLink to='/teams'>Teams</NavLink></Typography>
      <Typography variant='h6'><NavLink to='/players'>Players</NavLink></Typography>
      <Typography variant='h6'><NavLink to='/about'>About</NavLink></Typography>
    </Toolbar>
    <Outlet />
  </AppBar>
};

const theme = createTheme({
  palette: {
    primary: {
      main: '#e93a31',
    },
    secondary: {
      main: '#e93a31',
    },
  },
});

export default function App() {
  return <ThemeProvider theme={theme}>
    <BrowserRouter>
      <Routes>
        <Route path='/' element={<Menu />}>
          <Route index element={<Home />} />
          <Route path='*' element={<NoPage />} />
          <Route path='/teams' element={<Teams />} />
          <Route path='/players' element={<Players />} />
          <Route path='/about' element={<About />} />
          <Route path='/team/:teamName' element={<Team />} />
          <Route path='/match/:matchId' element={<Match />} />
          <Route path='/player/:playerId' element={<Player />} />
        </Route>
      </Routes>
    </BrowserRouter>
  </ThemeProvider>;
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);