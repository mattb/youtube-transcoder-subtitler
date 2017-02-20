import { combineReducers } from 'redux';

const videos = (state = { version: 0 }, action) => {
  switch (action.type) {
    case 'NEW_VIDEOS':
      return {
        version: state.version + 1
      };
    case 'JOB_FINISH':
      return {
        version: state.version + 1
      };
    default:
      return state;
  }
};

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
    videos,
    apollo: client.reducer()
  });
}
