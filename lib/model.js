const Promise = require('bluebird');
const youtubeDl = Promise.promisifyAll(require('youtube-dl'));
const fs = Promise.promisifyAll(require('fs'));
const AWS = require('aws-sdk');
const pipefy = require('pipefy');
const ffmpeg = require('fluent-ffmpeg');
const uuidV4 = require('uuid/v4');

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

const downloadToS3 = (bucket, id, log) => new Promise((resolve, reject) => {
  const logger = log || (l => console.log(l));
  let myInfo = {};
  const opts = {
    Bucket: bucket,
    ACL: 'public-read'
  };

  const youtubeUrl = `https://www.youtube.com/watch?v=${id}`;

  logger({ event: 'progress', message: `Going to download ${youtubeUrl}` });

  const mp4Opts = Object.assign({}, opts, {
    Key: `${id}.mp4`,
    ContentType: 'video/mp4'
  });
  let size = 0;
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
      .then(() => logger({ event: 'progress', message: 'Metadata uploaded' }));
    logger({
      event: 'progress',
      message: `Download of ${info.filename} started`
    });
    size = info.size;
  });

  let downloaded = 0;
  let lastPercent = -1;
  video.on('data', chunk => {
    downloaded += chunk.length;
    if (size > 0) {
      const percent = (100 * downloaded / size).toFixed(0);
      if (percent % 10 === 0 && lastPercent !== percent) {
        logger({
          event: 'progress',
          message: `Downloaded ${percent}%`
        });
        lastPercent = percent;
      }
    }
  });
  video.pipe(s3.putObject(mp4Opts, err => {
      if (err) {
        logger({
          event: 'progress',
          message: `Storage error: ${err}`,
          error: err
        });
        reject(err);
      } else {
        logger({ event: 'progress', message: 'Finished storing' });
        resolve(myInfo);
      }
    }));
});

const downloadSubs = (url, outputFilename, log) => {
  const logger = log || (l => console.log(l));
  logger({ event: 'progress', message: `Downloading subtitles for ${url}` });
  const options = { lang: 'en', all: false, cwd: '/tmp' };
  return youtubeDl.getSubsAsync(url, options).then(files => {
    if (files.length > 0) {
      const file = files[0];
      return fs
        .renameAsync(`/tmp/${file}`, outputFilename)
        .then(() => logger({
          event: 'progress',
          message: `Finished downloading subtitles for ${url}`
        }))
        .then(() => outputFilename);
    }
    return undefined;
  });
};

const encodeFromS3 = (bucket, subtitleFile, inputPath, outputPath, log) => {
  const logger = log || (l => console.log(l));
  logger({
    event: 'progress',
    message: `Subtitling ${inputPath} with ${subtitleFile} to ${outputPath}`
  });
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
        logger({
          event: 'progress',
          message: `Converted ${lastDatasize.toFixed(0)}mb`
        });
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
        logger({
          event: 'progress',
          message: `Finished converting file ${outputPath}`
        });
      })
      .pipe(output, { end: true });
  });
};

const subtitleMovie = (bucket, id, log) => {
  const youtubeUrl = `https://www.youtube.com/watch?v=${id}`;
  const vttFilename = `/tmp/${uuidV4()}.vtt`;
  return downloadSubs(youtubeUrl, vttFilename, log)
    .then(filename =>
      encodeFromS3(bucket, filename, `${id}.mp4`, `${id}_subbed.mp4`, log))
    .then(() => fs.rmAsync(vttFilename))
    .then(() => ({
      url: `https://${bucket}.s3.amazonaws.com/${id}_subbed.mp4`
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

const getS3 = (bucket, path) =>
  s3
    .getObject({ Bucket: bucket, Key: path })
    .promise()
    .then(result => JSON.parse(result.Body.toString()));

const getS3Json = (bucket, id) => getS3(bucket, `${id}.json`);

const listS3Json = bucket => listS3(bucket)
  .then(list => list.filter(file => file.Key.endsWith('.json')))
  .then(files => Promise.all(files.map(file => getS3(bucket, file.Key))));

module.exports = {
  downloadToS3,
  listS3,
  listS3Json,
  getS3Json,
  encodeFromS3,
  downloadSubs,
  subtitleMovie
};
