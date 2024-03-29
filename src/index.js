import { useState } from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route, Outlet, NavLink } from 'react-router-dom';
import { AppBar, Toolbar, Typography, Container, Box, IconButton, MenuItem,
  Button, Menu } from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
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

function ResponsiveNavbar() {
  const [anchorElNav, setAnchorElNav] = useState(null);
  const pages = [
    {link: '/', label: 'Home'},
    {link: '/teams', label: 'Teams'},
    {link: '/players', label: 'Players'},
    {link: '/about', label: 'About'},
  ];
  return <AppBar position='static'>
    <Container maxWidth='xl'>
      <Toolbar disableGutters sx={{ height: 64 }}>
        <Box sx={{ display: { xs: 'none', sm: 'flex' }, mr: 1 }}>
          <img src='/images/footy-charts-high-resolution-logo-white-transparent.png' height='50px' />
        </Box>
        <Box sx={{ flexGrow: 1, display: { xs: 'flex', sm: 'none' } }}>
          <IconButton
            size='large'
            aria-label='account of current user'
            aria-controls='menu-appbar'
            aria-haspopup='true'
            onClick={e => setAnchorElNav(e.currentTarget)}
            color='inherit'
          >
            <MenuIcon />
          </IconButton>
          <Menu
            id='menu-appbar'
            anchorEl={anchorElNav}
            anchorOrigin={{vertical: 'bottom', horizontal: 'left'}}
            keepMounted
            transformOrigin={{vertical: 'top', horizontal: 'left'}}
            open={Boolean(anchorElNav)}
            onClose={e => setAnchorElNav(null)}
            sx={{display: { xs: 'block', md: 'none' }}}
          >
            {pages.map(x => (
              <MenuItem key={x.label} onClick={e => setAnchorElNav(null)}>
                <Typography textAlign='center'><NavLink to={x.link}>{x.label}</NavLink></Typography>
              </MenuItem>
            ))}
          </Menu>
        </Box>
        <Box sx={{ display: { xs: 'flex', sm: 'none' }, mr: 1 }}>
          <img src='/images/footy-charts-high-resolution-logo-white-transparent.png' height='50px' />
        </Box>
        <Box sx={{ flexGrow: 1, display: { xs: 'none', sm: 'flex' } }}>
          {pages.map(x => (
            <Button
              key={x.label}
              onClick={e => setAnchorElNav(null)}
              sx={{ my: 2, color: 'white', display: 'block' }}
            ><NavLink to={x.link}>{x.label}</NavLink></Button>
          ))}
        </Box>
      </Toolbar>
    </Container>
    <Outlet />
  </AppBar>
}

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
        <Route path='/' element={<ResponsiveNavbar />}>
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