import { combineReducers } from 'redux';
import { handleActions } from 'redux-actions';
import actions from './actions';

const videos = handleActions(
  {
    [actions.newVideos]: state => ({
      version: state.version + 1
    })
  },
  { version: 0 }
);

const jobqueue = handleActions(
  {
    [actions.jobStart]: (state, action) => ({
      job_ids: [action.payload].concat(state.job_ids),
      working: true,
      current_job_id: action.payload
    }),
    [actions.jobFinish]: (state, action) => {
      const job_ids = state.job_ids.filter(id => id !== action.payload);
      return {
        job_ids,
        working: job_ids.length > 0,
        current_job_id: job_ids[0]
      };
    }
  },
  { job_ids: [], working: false }
);

export default function getReducer(client) {
  return combineReducers({
    jobqueue,
    videos,
    apollo: client.reducer()
  });
}
