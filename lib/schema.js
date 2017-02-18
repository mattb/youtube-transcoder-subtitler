const model = require('./model');
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
    subtitle: (_, { id }, { log }) => model.subtitleMovie(BUCKET, id, log)
  }
};

module.exports = makeExecutableSchema({
  typeDefs: schema,
  resolvers
});
