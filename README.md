# showcase-site

## Plan
- Windows dev environment
- React front-end
- Single-page app with client-side routing (static JS and templated HTML)
- Flask API server
- PostgreSQL database
- Data to display: AFL
- Deployment using Render

## Screenshots
Home page:
![](./screenshots/home.png)

Match page:
![](./screenshots/match.png)

Individual player page:
![](./screenshots/player.png)

Team page:
![](./screenshots/team.png)

Player search page:
![](./screenshots/players.png)

All teams page:
![](./screenshots/teams.png)

## Setup
```bash
npm run watch
flask --app api/app run
psql -d postgres -U site_admin
python311 ingest_historical.py
python311 -c "from ingest_live import job; job()"
python311 ingest_live.py
```

```sql
CREATE DATABASE site_db;
```

## Site design
- Home page shows the current season's ladder, current round's matches and a random player's stats
- Each team can be selected; this will show a list of all the team's current players
- Each match can be selected; this will show a field with all players in the match and their stats
- Each player can be selected; this will show their historical stats
- Teams page showing list of teams

## TODO
- Check DTLive terms of use
- Search for alternate datasets and possibly replace DTLive data:
  - https://datasportsgroup.com/coverage/australian-football/
  - https://api.squiggle.com.au/ (no player stats)
  - https://jimmyday12.github.io/fitzRoy/index.html
  - https://jimmyday12.github.io/fitzRoy/articles/using-fryzigg-stats.html
  - https://www.footywire.com/
  - https://afltables.com (SSR)
  - https://finalsiren.com (SSR)
- Fix API requests to unknown routes
- Websocket for updating live data
- Update Render to paid version (database expires June 23 2024) or switch deployment method
- Better scrollboxes for mobile
- Prevent site from crashing when a request fails
- Deploy live script
- Loading spinners
- Minify the JS
- Page for comparing players