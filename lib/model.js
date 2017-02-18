const Promise = require('bluebird');
const youtubeDl = Promise.promisifyAll(require('youtube-dl'));
const AWS = require('aws-sdk');
const pipefy = require('pipefy');

const credentials = new AWS.Credentials(
  '***REMOVED***',
  '***REMOVED***'
);

const westConfig = new AWS.Config();
westConfig.update({ region: 'us-west-1', credentials });
const s3 = new AWS.S3(westConfig);

const putObject = s3.putObject.bind(s3);

s3.putObject = function po(opts, cb) {
  function mapBody(buffer) {
    putObject(Object.assign(opts, { Body: buffer }), cb);
  }

  if (!opts.Body) {
    return pipefy(mapBody);
  }
  return putObject(opts, cb);
};

const downloadToS3 = (bucket, id) => new Promise((resolve, reject) => {
  let myInfo = {};
  const opts = {
    Bucket: bucket,
    ACL: 'public-read'
  };

  const youtubeUrl = `https://www.youtube.com/watch?v=${id}`;
  const mp4Opts = Object.assign({}, opts, {
    Key: `${id}.mp4`,
    ContentType: 'video/mp4'
  });
  const video = youtubeDl(youtubeUrl, [], { maxBuffer: Infinity });
  video.on('info', info => {
    myInfo = Object.assign({}, info, {
      url: `https://${bucket}.s3.amazonaws.com/${id}.mp4`
    });
    const jsonOpts = Object.assign({}, opts, {
      Key: `${id}.json`,
      Body: JSON.stringify(myInfo),
      ContentType: 'application/json'
    });
    s3
      .putObject(jsonOpts)
      .promise()
      .then(done => console.log('JSON uploaded', done));
    console.log('Download started');
    console.log(`filename: ${info.filename}`);
    console.log(`size: ${info.size}`);
  });
  video.pipe(s3.putObject(mp4Opts, err => {
      if (err) {
        reject(err);
      } else {
        resolve(myInfo);
      }
    }));
});

const listS3 = (bucket, path) =>
  s3
    .listObjectsV2({ Prefix: path, Bucket: bucket })
    .promise()
    .then(files => files.Contents
      .sort((b, a) => a.LastModified - b.LastModified)
      .map(file => Object.assign(file, {
        url: `https://${bucket}.s3.amazonaws.com/${file.Key}`
      })));

const getS3 = (bucket, path) =>
  s3
    .getObject({ Bucket: bucket, Key: path })
    .promise()
    .then(result => JSON.parse(result.Body.toString()));

const getS3Json = (bucket, id) => getS3(bucket, `${id}.json`);

const listS3Json = bucket => listS3(bucket)
  .then(list => list.filter(file => file.Key.endsWith('.json')))
  .then(files => Promise.all(files.map(file => getS3(bucket, file.Key))));

module.exports = { downloadToS3, listS3, listS3Json, getS3Json };
