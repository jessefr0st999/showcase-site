import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';

function About() {
  return (
    <div className='app'>
      <Card>
        <CardContent>
          <Typography>
            All data sourced from <a href='https://www.dtlive.com.au' target='_blank'>DTLive</a>'s
            {' '}<a href='https://www.dtlive.com.au/afl/xml/' target='_blank'>XML feed</a> for AFL.
          </Typography>
          <Typography>
            Hosting provided by <a href='https://render.com' target='_blank'>Render</a>.
          </Typography>
          <Typography>
            Site is currently a work in progress.
          </Typography>
          <Typography>
            Contact me at <a href='mailto://jessefrost999@gmail.com' target='_blank'>jessefrost999@gmail.com</a>
            {' '}for more information.
          </Typography>
        </CardContent>
      </Card>
    </div>
  );
};
  
export default About;