const Promise = require('bluebird');
const youtubeDl = Promise.promisifyAll(require('youtube-dl'));
const fs = Promise.promisifyAll(require('fs'));
const AWS = require('aws-sdk');
const pipefy = require('pipefy');
const ffmpeg = require('fluent-ffmpeg');
const uuidV4 = require('uuid/v4');
const redis = require('redis');
// const kue = require('kue');
const flat = require('flat');
const _ = require('lodash');

Promise.promisifyAll(redis.RedisClient.prototype);
Promise.promisifyAll(redis.Multi.prototype);

const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';

const redisClient = redis.createClient(redisUrl);

const s3Bucket = process.env.S3_BUCKET || 'mattb-transcoder';
const METADATA_KEY = `${s3Bucket}:metadata`;

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
const westConfig = new AWS.Config();
westConfig.update({ region: 'us-west-1' });
const s3 = new AWS.S3(westConfig);

const putObject = s3.putObject.bind(s3);

const listS3 = path =>
  s3
    .listObjectsV2({ Prefix: path, Bucket: s3Bucket })
    .promise()
    .then(files => files.Contents
      .sort((b, a) => a.LastModified - b.LastModified)
      .map(file => Object.assign(file, {
        url: `https://${s3Bucket}.s3.amazonaws.com/${file.Key}`
      })));

s3.putObject = function po(opts, cb) {
  function mapBody(buffer) {
    putObject(Object.assign(opts, { Body: buffer }), cb);
  }

  if (!opts.Body) {
    return pipefy(mapBody);
  }
  return putObject(opts, cb);
};

const getMetadata = id =>
  redisClient.hgetallAsync(id).then(r => flat.unflatten(r));

const deleteMetadata = id => getMetadata(id).then(data => {
  redisClient
    .zremAsync(METADATA_KEY, id)
    .then(
      Promise.all(_.keys(flat(data)).map(k => redisClient.hdelAsync(id, k)))
    );
});

const getAllMetadata = () =>
  redisClient
    .zrevrangeAsync(METADATA_KEY, 0, -1)
    .then(ids => Promise.all(ids.map(id => getMetadata(id))));

const putMetadata = (id, data) =>
  Promise.all([
    redisClient.zaddAsync(METADATA_KEY, Date.now(), id),
    redisClient.hmsetAsync(id, flat(pruneEmpty(data)))
  ]);

const assignMetadata = (id, newData) =>
  getMetadata(id).then(data =>
    putMetadata(id, Object.assign({}, data, newData)));

const downloadToS3 = (id, job) => new Promise((resolve, reject) => {
  let myInfo = {};
  let size = 0;
  let downloaded = 0;

  const youtubeUrl = `https://www.youtube.com/watch?v=${id}`;

  job.progress(downloaded, size, `Going to download ${youtubeUrl}`);

  const video = youtubeDl(youtubeUrl, [], { maxBuffer: Infinity });
  video.on('info', info => {
    myInfo = Object.assign({}, info, {
      url: `https://${s3Bucket}.s3.amazonaws.com/${id}.mp4`
    });
    putMetadata(id, myInfo).then(() =>
      job.progress(downloaded, size, 'Metadata saved'));

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

  const mp4Opts = {
    Bucket: s3Bucket,
    ACL: 'public-read',
    Key: `${id}.mp4`,
    ContentType: 'video/mp4'
  };
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

const deleteS3 = id => {
  const filenames = [`${id}.mp4`, `${id}_subbed.mp4`];
  return Promise.all([s3.deleteObjects({
      Bucket: s3Bucket,
      Delete: {
        Objects: filenames.map(name => ({ Key: name }))
      }
    }).promise(), deleteMetadata(id)]);
};

const encodeFromS3 = (id, subtitleFile, inputPath, outputPath, job) => {
  job.progress(
    0,
    100,
    `Subtitling ${inputPath} with ${subtitleFile} to ${outputPath}`
  );
  return getMetadata(id).then(
    info => new Promise((resolve, reject) => {
      const size = info.size;
      let downloaded = 0;
      const input = s3
        .getObject({ Bucket: s3Bucket, Key: inputPath })
        .createReadStream();
      const output = s3.putObject(
        {
          Bucket: s3Bucket,
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
        downloaded += chunk.length;
        let message = `Converted ${(downloaded / 1024 / 1024).toFixed(0)}mb`;
        if (downloaded === size) {
          message = 'Conversion completing, uploading to storage...';
        }
        job.progress(downloaded, size, message);
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
    })
  );
};

const subtitleMovie = (id, job) => {
  const youtubeUrl = `https://www.youtube.com/watch?v=${id}`;
  const vttFilename = `/tmp/${uuidV4()}.vtt`;
  const subtitled_url = `https://${s3Bucket}.s3.amazonaws.com/${id}_subbed.mp4`;
  return downloadSubs(youtubeUrl, vttFilename, job)
    .then(filename =>
      encodeFromS3(id, filename, `${id}.mp4`, `${id}_subbed.mp4`, job))
    .then(() => fs.unlinkAsync(vttFilename))
    .then(() => {
      job.progress(100, 100, 'Updating metadata...');
      return assignMetadata(id, { subtitled_url });
    })
    .then(() => ({
      url: subtitled_url
    }));
};

module.exports = {
  redisUrl,
  s3Bucket,
  downloadToS3,
  listS3,
  getAllMetadata,
  getMetadata,
  putMetadata,
  deleteS3,
  assignMetadata,
  encodeFromS3,
  downloadSubs,
  subtitleMovie
};
