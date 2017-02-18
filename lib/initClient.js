import ApolloClient, { createNetworkInterface } from 'apollo-client';
import parse from 'url-parse';

let apolloClient = null;
const port = process.env.PORT || 3000;

function createClient() {
  let uri = `http://localhost:${port}/graphql`;
  if (global.window) {
    const url = parse(global.window.location);
    uri = `${url.origin}/graphql`;
  }
  return new ApolloClient({
    ssrMode: !process.browser,
    dataIdFromObject: result => result.id || null,
    networkInterface: createNetworkInterface({
      uri,
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
