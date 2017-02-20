const Promise = require('bluebird');
const youtubeDl = Promise.promisifyAll(require('youtube-dl'));
const fs = Promise.promisifyAll(require('fs'));
const AWS = require('aws-sdk');
const pipefy = require('pipefy');
const ffmpeg = require('fluent-ffmpeg');
const uuidV4 = require('uuid/v4');
const redis = Promise.promisifyAll(require('redis'));
// const kue = require('kue');
const flat = require('flat');
const _ = require('lodash');

const REDIS_DEFAULT = '***REMOVED***';
const redisClient = redis.createClient(process.env.REDIS_URL || REDIS_DEFAULT);

const pruneEmpty = obj => (function prune(current) {
  _.forOwn(current, (value, key) => {
    if (
      _.isUndefined(value) ||
        _.isNull(value) ||
        _.isNaN(value) ||
        _.isString(value) && _.isEmpty(value) ||
        _.isObject(value) && _.isEmpty(prune(value))
    ) {
      delete current[key]; // eslint-disable-line no-param-reassign
    }
  });
  // remove any leftover undefined values from the delete
  // operation on an array
  if (_.isArray(current)) _.pull(current, undefined);

  return current;
})(_.cloneDeep(obj)); // Do not modify the original object, create a clone instead
const storeObject = (id, data) =>
  redisClient.hmsetAsync(id, flat(pruneEmpty(data)));
const loadObject = id =>
  redisClient.hgetallAsync(id).then(r => flat.unflatten(r));

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

const getS3 = (bucket, path) =>
  s3
    .getObject({ Bucket: bucket, Key: path })
    .promise()
    .then(result => JSON.parse(result.Body.toString()));

const getS3Json = (bucket, id) => getS3(bucket, `${id}.json`);

const assignS3Json = (bucket, id, newData) =>
  getS3Json(bucket, id).then(data => s3.putObject({
    Bucket: bucket,
    Key: `${id}.json`,
    Body: JSON.stringify(Object.assign({}, data, newData)),
    ContentType: 'application/json'
  }).promise());

const downloadToS3 = (bucket, id, job) => new Promise((resolve, reject) => {
  let myInfo = {};
  const opts = {
    Bucket: bucket,
    ACL: 'public-read'
  };

  let size = 0;
  let downloaded = 0;

  const youtubeUrl = `https://www.youtube.com/watch?v=${id}`;

  job.progress(downloaded, size, `Going to download ${youtubeUrl}`);

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
      .then(() => job.progress(downloaded, size, 'Metadata saved'));

    size = info.size;

    job.progress(downloaded, size, `Download of ${info.filename} started`);
  });

  video.on('data', chunk => {
    downloaded += chunk.length;
    let message = `Downloaded ${(downloaded / 1024 / 1024).toFixed(0)}mb`;
    if (downloaded === size) {
      message = 'Download completing, uploading to storage...';
    }
    job.progress(downloaded, size, message);
  });
  video.pipe(s3.putObject(mp4Opts, err => {
      if (err) {
        reject(err);
      } else {
        job.progress(100, 100, 'Video stored');
        resolve(myInfo);
      }
    }));
});

const downloadSubs = (url, outputFilename, job) => {
  job.progress(0, 0, `Downloading subtitles for ${url}`);
  const options = { lang: 'en', all: false, cwd: '/tmp' };
  return youtubeDl.getSubsAsync(url, options).then(files => {
    if (files.length > 0) {
      const file = files[0];
      return fs
        .renameAsync(`/tmp/${file}`, outputFilename)
        .then(() =>
          job.progress(1, 100, `Finished downloading subtitles for ${url}`))
        .then(() => outputFilename);
    }
    return undefined;
  });
};

const encodeFromS3 = (bucket, subtitleFile, inputPath, outputPath, job) => {
  job.progress(
    10,
    100,
    `Subtitling ${inputPath} with ${subtitleFile} to ${outputPath}`
  );
  return new Promise((resolve, reject) => {
    let datasize = 0;
    let lastDatasize = -1;
    const input = s3
      .getObject({ Bucket: bucket, Key: inputPath })
      .createReadStream();
    const output = s3.putObject(
      {
        Bucket: bucket,
        Key: outputPath,
        ACL: 'public-read',
        ContentType: 'video/mp4'
      },
      (err, data) => {
        if (err) {
          reject(err);
        } else {
          resolve(data);
        }
      }
    );
    input.on('data', chunk => {
      datasize += chunk.length / 1024 / 1024;
      if (datasize - lastDatasize > 1) {
        lastDatasize = datasize;
        job.progress(50, 100, `Converted ${lastDatasize.toFixed(0)}mb`);
      }
    });
    ffmpeg()
      .input(input)
      .inputFormat('mp4')
      .videoFilters(
        `subtitles=${subtitleFile}:force_style='FontSize=24,BorderStyle=3'`
      )
      .format('mp4')
      .outputOptions('-movflags frag_keyframe+empty_moov')
      .on('error', (err, stdout, stderr) => {
        console.log('Error processing', err);
        console.log(stdout);
        console.log(stderr);
        reject(err);
      })
      .on('end', () => {
        job.progress(
          100,
          100,
          `Finished converting file ${outputPath}, now uploading to storage...`
        );
      })
      .pipe(output, { end: true });
  });
};

const subtitleMovie = (bucket, id, job) => {
  const youtubeUrl = `https://www.youtube.com/watch?v=${id}`;
  const vttFilename = `/tmp/${uuidV4()}.vtt`;
  const subtitled_url = `https://${bucket}.s3.amazonaws.com/${id}_subbed.mp4`;
  return downloadSubs(youtubeUrl, vttFilename, job)
    .then(filename =>
      encodeFromS3(bucket, filename, `${id}.mp4`, `${id}_subbed.mp4`, job))
    .then(() => fs.unlinkAsync(vttFilename))
    .then(() => {
      job.progress(100, 100, 'Updating metadata...');
      return assignS3Json(bucket, id, { subtitled_url });
    })
    .then(() => ({
      url: subtitled_url
    }));
};

const listS3 = (bucket, path) =>
  s3
    .listObjectsV2({ Prefix: path, Bucket: bucket })
    .promise()
    .then(files => files.Contents
      .sort((b, a) => a.LastModified - b.LastModified)
      .map(file => Object.assign(file, {
        url: `https://${bucket}.s3.amazonaws.com/${file.Key}`
      })));

const listS3Json = bucket => listS3(bucket)
  .then(list => list.filter(file => file.Key.endsWith('.json')))
  .then(files => Promise.all(files.map(file => getS3(bucket, file.Key))));

module.exports = {
  downloadToS3,
  listS3,
  listS3Json,
  getS3Json,
  assignS3Json,
  encodeFromS3,
  downloadSubs,
  subtitleMovie,
  storeObject,
  loadObject
};
