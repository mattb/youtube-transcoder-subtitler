import { combineReducers } from 'redux';

const jobqueue = (state = { job_ids: [] }, action) => {
  switch (action.type) {
    case 'JOB_START':
      return {
        job_ids: [action.payload].concat(state.job_ids)
      };
    case 'JOB_FINISH':
      return {
        job_ids: state.job_ids.filter(id => id !== action.payload)
      };
    default:
      return state;
  }
};

export default function getReducer(client) {
  return combineReducers({
    jobqueue,
    apollo: client.reducer()
  });
}
