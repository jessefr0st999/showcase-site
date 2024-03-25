import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route, Outlet, Link } from 'react-router-dom';
import { AppBar, Toolbar, Typography } from '@mui/material';

import './index.css';
import Home from './Home';
import NoPage from './NoPage';
import Teams from './Teams';
import Players from './Players';
import Team from './Team';
import Match from './Match';
import Player from './Player';

function Menu() {
  return <AppBar position="static">
    <Toolbar>
      <Typography variant="h4">Footy Charts</Typography>
      <Typography variant="h6"><Link to="/">Home</Link></Typography>
      <Typography variant="h6"><Link to="/teams">Teams</Link></Typography>
      <Typography variant="h6"><Link to="/players">Players</Link></Typography>
    </Toolbar>
    <Outlet />
  </AppBar>
};

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Menu />}>
          <Route index element={<Home />} />
          <Route path="*" element={<NoPage />} />
          <Route path="/teams" element={<Teams />} />
          <Route path="/players" element={<Players />} />
          <Route path="/team/:teamName" element={<Team />} />
          <Route path="/match/:matchId" element={<Match />} />
          <Route path="/player/:playerId" element={<Player />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);