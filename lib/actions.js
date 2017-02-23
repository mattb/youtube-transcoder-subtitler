import { createActions } from 'redux-actions';
import gql from 'graphql-tag';

const mutations = {
  fetchVideo: (
    gql`
mutation fetchVideo($id: String!) {
  enqueueDownload(id:$id) {
    id
  }
}
  `
  ),
  subtitleVideo: (
    gql`
mutation subtitleVideo($id: String!) {
  enqueueSubtitle(id:$id) {
    id
  }
}
`
  ),
  deleteFile: (
    gql`
mutation DeleteFile($id: String!) {
  deleteFile(id:$id)
}
`
  )
};

const actions = createActions('NEW_VIDEOS', 'JOB_FINISH', 'JOB_START');

const thunkActions = {
  downloadVideo: id => async (dispatch, getState, client) => {
    const { data } = await client.mutate({
      mutation: mutations.fetchVideo,
      variables: {
        id
      }
    });
    dispatch(actions.jobStart(data.enqueueDownload.id));
  },
  deleteFile: id => async (dispatch, getState, client) => {
    await client.mutate({
      mutation: mutations.deleteFile,
      variables: {
        id
      }
    });
    dispatch(actions.newVideos());
  },
  subtitleVideo: id => async (dispatch, getState, client) => {
    const { data } = await client.mutate({
      mutation: mutations.subtitleVideo,
      variables: {
        id
      }
    });
    dispatch(actions.jobStart(data.enqueueSubtitle.id));
  },
  jobFinishWithNewVideos: id => dispatch => {
    dispatch(actions.jobFinish(id));
    dispatch(actions.newVideos());
  }
};

export default Object.assign({}, actions, thunkActions);
