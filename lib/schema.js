const makeExecutableSchema = require('graphql-tools').makeExecutableSchema;

const schema = `
type Query {
  files: [File]
}

type File {
  id: String!
  url: String!
  name: String!
}
`;
const resolvers = {
  Query: {
    files: () => [
      {
        id: 'id',
        url: 'url',
        name: 'name'
      },
      {
        id: 'id2',
        url: 'url2',
        name: 'name2'
      }
    ]
  }
};

module.exports = makeExecutableSchema({
  typeDefs: schema,
  resolvers
});
