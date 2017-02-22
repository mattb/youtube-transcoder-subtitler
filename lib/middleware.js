import { applyMiddleware, compose } from 'redux';
import thunk from 'redux-thunk';

export default function createMiddleware(client) {
  const middleware = applyMiddleware(
    client.middleware(),
    thunk.withExtraArgument(client)
  );
  if (process.browser && window.devToolsExtension) {
    return compose(middleware, window.devToolsExtension());
  }
  return middleware;
}
