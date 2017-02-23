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
      job_ids: [action.payload].concat(state.job_ids)
    }),
    [actions.jobFinish]: (state, action) => ({
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
