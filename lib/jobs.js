const kue = require('kue');
const Rx = require('rxjs/Rx');

const model = require('./model');

const REDIS_DEFAULT = '***REMOVED***';

const queue = kue.createQueue({
  redis: process.env.REDIS_URL || REDIS_DEFAULT
});

const eventObservables = [
  'failed',
  'enqueue',
  'start',
  'complete',
  'progress'
].map(eventName => Rx.Observable.fromEvent(queue, `job ${eventName}`).map((
  ...params
) => ({
  event: eventName,
  params
})));
const events = Rx.Observable.merge(...eventObservables);

const processJobs = () => {
  queue.watchStuckJobs();
  queue.process('download', (job, done) => {
    model.downloadToS3(job.data.bucket, job.data.id, log => {
      console.log('DOWNLOAD', job.id, log);
    }).then(() => done());
  });
  queue.process('subtitle', (job, done) => {
    model.subtitleMovie(job.data.bucket, job.data.id, log => {
      console.log('SUBTITLE', job.id, log);
    }).then(() => done());
  });
};

module.exports = {
  app: kue.app,
  queue,
  events,
  processJobs
};
