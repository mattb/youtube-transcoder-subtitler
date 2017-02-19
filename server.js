const express = require('express');
const cookieSession = require('cookie-session');
const next = require('next');
const bodyParser = require('body-parser');
const { graphqlExpress } = require('graphql-server-express');
const Rx = require('rxjs/Rx');
const uuidV4 = require('uuid/v4');

const dev = process.env.NODE_ENV !== 'production';
const port = process.env.PORT || 3000;
const app = next({ dev });
const handle = app.getRequestHandler();

const schema = require('./lib/schema');
const jobs = require('./lib/jobs');

app.prepare().then(() => {
  const streams = {};
  const server = express();
  const log = request => data => {
    const myData = Object.assign({}, { timestamp: Date.now() }, data);
    if (request.session.id && request.session.id in streams) {
      streams[request.session.id].next(myData);
    }
  };

  server.use(cookieSession({
      name: 'session',
      keys: ['804DEE06-E176-42B7-9A54-D7FE114266A8'],
      maxAge: (
        24 * 60 * 60 * 1000
      ) // 24 hours
    }));

  server.use('/kue', jobs.app);

  server.get('/jobs', (req, res) => {
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive'
    });
    const end = Rx.Observable.fromEvent(req, 'close');
    jobs.events.takeUntil(end).subscribe(event => {
      res.write(
        `event: ${event.event}\ndata:${JSON.stringify(event.params)}\n\n`
      );
    }, err => {
      console.log('Stream error', err);
    }, () => {
      res.end();
    });
    Rx.Observable
      .interval(15000)
      .takeUntil(end)
      .subscribe(() =>
        res.write(
          `event: ping\ndata:${JSON.stringify({ timestamp: Date.now() })}\n\n`
        ));
  });

  server.use('/graphql', bodyParser.json(), graphqlExpress(request => ({
      schema,
      context: { log: log(request) }
    })));

  server.get('/stream', (req, res) => {
    const id = req.session.id;
    if (!id) {
      res.status(406).end();
    } else {
      res.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive'
      });
      streams[id] = new Rx.Subject();
      const end = Rx.Observable.fromEvent(req, 'close');
      streams[id].takeUntil(end).subscribe(data => {
        const myData = Object.assign({}, data);
        const evt = myData.event;
        delete myData.event;
        res.write(`event: ${evt}\ndata:${JSON.stringify(myData)}\n\n`);
      }, err => {
        console.log('Stream error', err);
      }, () => {
        res.end();
      });
      Rx.Observable
        .interval(15000)
        .takeUntil(end)
        .map(() => ({ event: 'ping', id, timestamp: Date.now() }))
        .subscribe(streams[id]);
    }
  });

  server.get('*', (req, res) => {
    if (!req.session.id) {
      req.session.id = uuidV4(); // eslint-disable-line no-param-reassign
    }
    handle(req, res);
  });

  server.listen(port, '0.0.0.0', err => {
    if (err) throw err;
    console.log(`> Ready on http://0.0.0.0:${port}`);
  });
});
