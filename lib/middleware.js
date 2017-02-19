import { applyMiddleware, compose } from 'redux';
import thunk from 'redux-thunk';

export default function createMiddleware(clientMiddleware) {
  const middleware = applyMiddleware(clientMiddleware, thunk);
  if (process.browser && window.devToolsExtension) {
    return compose(middleware, window.devToolsExtension());
  }
  return middleware;
}
