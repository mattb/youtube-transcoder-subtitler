import { combineReducers } from 'redux';
import { handleActions } from 'redux-actions';

const videos = handleActions(
  {
    NEW_VIDEOS: state => ({
      version: state.version + 1
    })
  },
  { version: 0 }
);

const jobqueue = handleActions(
  {
    JOB_START: (state, action) => ({
      job_ids: [action.payload].concat(state.job_ids)
    }),
    JOB_FINISH: (state, action) => ({
      job_ids: state.job_ids.filter(id => id !== action.payload)
    })
  },
  { job_ids: [] }
);

export default function getReducer(client) {
  return combineReducers({
    jobqueue,
    videos,
    apollo: client.reducer()
  });
}
