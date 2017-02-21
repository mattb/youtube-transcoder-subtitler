import { createActions } from 'redux-actions';

const actions = createActions('NEW_VIDEOS', 'JOB_FINISH', 'JOB_START');

const thunkActions = {
  jobFinishWithNewVideos: id => dispatch => {
    dispatch(actions.jobFinish(id));
    dispatch(actions.newVideos());
  }
};

export default Object.assign({}, actions, thunkActions);
