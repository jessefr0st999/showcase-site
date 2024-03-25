# showcase-site

## Plan
- Windows dev environment
- React front-end
- Single-page app with client-side routing (static JS and templated HTML)
- Flask API server
- PostgreSQL database
- Data to display: AFL

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
- Responsive charts
- Fix API requests to unknown routes
- 404 page
- Styling
- Players page with players searchable by text
- Pagination of home page to show ladder and matches for previous rounds and 
- Player search string in URL