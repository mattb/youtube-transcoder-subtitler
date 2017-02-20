const kue = require('kue');
const Rx = require('rxjs/Rx');

const model = require('./model');

const queue = kue.createQueue({
  redis: model.redisUrl
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
    model.downloadToS3(job.data.id, job).then(() => done());
  });
  queue.process('subtitle', (job, done) => {
    console.log('SUBTITLE', job.id, job.data);
    model.subtitleMovie(job.data.id, job).then(() => done());
  });
};

module.exports = {
  app: kue.app,
  queue,
  events,
  processJobs
};
