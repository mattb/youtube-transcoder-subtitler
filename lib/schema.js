const model = require('./model');
const jobs = require('./jobs');
const makeExecutableSchema = require('graphql-tools').makeExecutableSchema;

const BUCKET = 'mattb-transcoder';

const schema = `
schema {
  query: Query
  mutation: Mutation
}

type Query {
  file(id: String!): File
  files: [File]
}

type Mutation {
  download(id: String!): File
  subtitle(id: String!): Url
  enqueueDownload(id: String!): Job
  enqueueSubtitle(id: String!): Job
}

type Job {
  id: String
}

type Url {
  url: String!
}

type File {
  id: String!
  url: String!
  title: String!
  upload_date: String!
  thumbnail: String
}
`;
const resolvers = {
  Query: {
    file: (_, { id }) => model.getS3Json(BUCKET, id),
    files: () => model.listS3Json(BUCKET)
  },
  Mutation: {
    download: (_, { id }, { log }) => model.downloadToS3(BUCKET, id, log),
    subtitle: (_, { id }, { log }) => model.subtitleMovie(BUCKET, id, log),
    enqueueDownload: (_, { id }) => new Promise((resolve, reject) => {
      const job = jobs.queue
        .create('download', { id, bucket: BUCKET })
        .save(err => {
          if (err) {
            reject(err);
          } else {
            resolve({ id: job.id.toString() });
          }
        });
    }),
    enqueueSubtitle: (_, { id }) => new Promise((resolve, reject) => {
      const job = jobs.queue
        .create('subtitle', { id, bucket: BUCKET })
        .save(err => {
          if (err) {
            reject(err);
          } else {
            resolve({ id: job.id.toString() });
          }
        });
    })
  }
};

module.exports = makeExecutableSchema({
  typeDefs: schema,
  resolvers
});
