const express = require('express');
const compression = require('compression');
const next = require('next');
const bodyParser = require('body-parser');
const { graphqlExpress } = require('graphql-server-express');

const dev = process.env.NODE_ENV !== 'production';
const port = process.env.PORT || 3000;
const app = next({ dev });
const handle = app.getRequestHandler();

const schema = require('./lib/schema');
const jobs = require('./lib/jobs');

app.prepare().then(() => {
  const server = express();

  server.use(compression());

  server.use('/kue', jobs.app);

  server.use('/graphql', bodyParser.json(), graphqlExpress({ schema }));

  server.get('*', (req, res) => handle(req, res));

  server.listen(port, '0.0.0.0', err => {
    if (err) throw err;
    console.log(`> Ready on http://0.0.0.0:${port}`);
  });
});
