import ApolloClient, { createNetworkInterface } from 'apollo-client';

let apolloClient = null;
const port = process.env.PORT || 3000;

function createClient() {
  return new ApolloClient({
    ssrMode: !process.browser,
    dataIdFromObject: result => result.id || null,
    networkInterface: createNetworkInterface({
      uri: `http://localhost:${port}/graphql`,
      opts: {
        credentials: 'same-origin'
      }
    })
  });
}

export const initClient = headers => {
  if (!process.browser) {
    return createClient(headers);
  }
  if (!apolloClient) {
    apolloClient = createClient(headers);
  }
  return apolloClient;
};
