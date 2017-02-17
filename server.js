const express = require('express');
const next = require('next');
const bodyParser = require('body-parser');
const { graphqlExpress } = require('graphql-server-express');

const dev = process.env.NODE_ENV !== 'production';
const app = next({ dev });
const handle = app.getRequestHandler();

const schema = require('./lib/schema');

app.prepare().then(() => {
  const server = express();
  server.use('/graphql', bodyParser.json(), graphqlExpress({ schema }));

  server.get('*', (req, res) => handle(req, res));

  server.listen(3000, err => {
    if (err) throw err;
    console.log('> Ready on http://localhost:3000');
  });
});
