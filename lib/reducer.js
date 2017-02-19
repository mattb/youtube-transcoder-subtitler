import { combineReducers } from 'redux';

const counter = (state = 10, action) => {
  console.log('COUNTER', action);
  switch (action.type) {
    case 'INCREMENT':
      return state + 1;
    case 'DECREMENT':
      return state - 1;
    default:
      return state;
  }
};

export default function getReducer(client) {
  return combineReducers({
    counter,
    apollo: client.reducer()
  });
}
