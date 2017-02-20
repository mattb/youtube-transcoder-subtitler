const Promise = require('bluebird');
const model = require('./model');
const jobs = require('./jobs');
const getJob = Promise.promisify(require('kue').Job.get);
const makeExecutableSchema = require('graphql-tools').makeExecutableSchema;

const schema = `
schema {
  query: Query
  mutation: Mutation
}

type Query {
  file(id: String!): File
  files: [File]
  job(id: Int!): Job
}

type Mutation {
  enqueueDownload(id: String!): Job
  enqueueSubtitle(id: String!): Job
  deleteFile(id: String!): Boolean
}

type Job {
  id: Int!
  type: String!
  state: String!
  progress: String
  progress_data: String
  created_at: String
  failed_at: String
  started_at: String
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
  subtitled_url: String
}
`;

const resolveJob = id => getJob(id).then(j => Object.assign({}, j, {
  created_at: new Date(parseInt(j.created_at, 10)).toISOString(),
  failed_at: j.failed_at && new Date(parseInt(j.failed_at, 10)).toISOString(),
  started_at: (
    j.started_at && new Date(parseInt(j.started_at, 10)).toISOString()
  ),
  progress: j.progress(),
  progress_data: j.progress_data,
  state: j.state()
}));

const resolvers = {
  Query: {
    job: (_, { id }) => resolveJob(id),
    file: (_, { id }) => model.getMetadata(id),
    files: () => model.getAllMetadata()
  },
  Mutation: {
    deleteFile: (_, { id }) => model.deleteS3(id).then(() => true),
    enqueueDownload: (_, { id }) => new Promise((resolve, reject) => {
      const job = jobs.queue.create('download', { id }).save(err => {
        if (err) {
          reject(err);
        } else {
          resolve(resolveJob(job.id));
        }
      });
    }),
    enqueueSubtitle: (_, { id }) => new Promise((resolve, reject) => {
      const job = jobs.queue.create('subtitle', { id }).save(err => {
        if (err) {
          reject(err);
        } else {
          resolve(resolveJob(job.id));
        }
      });
    })
  }
};

module.exports = makeExecutableSchema({
  typeDefs: schema,
  resolvers
});
