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
    console.log('DOWNLOAD', job.id, job.data);
    model.downloadToS3(job.data.bucket, job.data.id, job).then(() => done());
  });
  queue.process('subtitle', (job, done) => {
    console.log('SUBTITLE', job.id, job.data);
    model.subtitleMovie(job.data.bucket, job.data.id, job).then(() => done());
  });
};

module.exports = {
  app: kue.app,
  queue,
  events,
  processJobs
};
