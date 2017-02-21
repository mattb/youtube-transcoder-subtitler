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
  /* eslint-disable no-underscore-dangle */
  return new ApolloClient({
    ssrMode: !process.browser,
    addTypename: true,
    dataIdFromObject: result => {
      if (result.id && result.__typename) {
        return `${result.__typename}-${result.id}`;
      }
      return null;
    },
    networkInterface: createNetworkInterface({
      uri,
      opts: {
        credentials: 'same-origin'
      }
    })
  });
  /* eslint-enable no-underscore-dangle */
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
