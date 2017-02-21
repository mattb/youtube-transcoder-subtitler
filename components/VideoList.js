import React from 'react';
import gql from 'graphql-tag';
import { graphql } from 'react-apollo';
import { connect } from 'react-redux';
import { Card, CardText } from 'react-md/lib/Cards';
import { Button } from 'react-md/lib/Buttons';
import actions from '../lib/actions';

const subtitleVideoMutation = gql`
mutation subtitleVideo($id: String!) {
  enqueueSubtitle(id:$id) {
    id
  }
}
`;

const deleteFileMutation = gql`
mutation DeleteFile($id: String!) {
  deleteFile(id:$id)
}
`;

const VideoList = (
  { files, deleteFile, subtitleVideo, jobStart, hideButtons, newVideos }
) => (
  <div className="md-grid">
    {files.map(file => (
      <Card className="md-cell" key={file.id}>
        <CardText>
          <h3
            style={{
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis'
            }}
          >
            {file.title}
          </h3>
          <video
            src={file.url}
            poster={file.thumbnail}
            type="video/mp4"
            controls="true"
            style={{ width: '100%' }}
          />
          {file.subtitled_url &&
            <a href={file.subtitled_url} download={`${file.id}_subbed.mp4`}>
              <Button raised label="Download subtitled version" />
            </a>}
          {!hideButtons &&
            !file.subtitled_url &&
            <Button
              raised
              label="Subtitle it!"
              onClick={() => subtitleVideo({
                variables: {
                  id: file.id
                }
              }).then(({ data }) => {
                jobStart(data.enqueueSubtitle.id);
              })}
            />}
          <Button
            raised
            label="Delete it!"
            onClick={() => deleteFile({
              variables: {
                id: file.id
              }
            }).then(() => {
              newVideos();
            })}
          />
        </CardText>
      </Card>
    ))}
  </div>
);

VideoList.propTypes = {
  hideButtons: React.PropTypes.bool,
  files: React.PropTypes.arrayOf(React.PropTypes.shape({
      id: React.PropTypes.string.isRequired,
      title: React.PropTypes.string.isRequired,
      url: React.PropTypes.string.isRequired,
      thumbnail: React.PropTypes.string.isRequired
    })).isRequired,
  deleteFile: React.PropTypes.func.isRequired,
  subtitleVideo: React.PropTypes.func.isRequired,
  jobStart: React.PropTypes.func.isRequired,
  newVideos: React.PropTypes.func.isRequired
};
VideoList.defaultProps = {
  hideButtons: false
};

const VideoListWithData = graphql(deleteFileMutation, { name: 'deleteFile' })(
  graphql(subtitleVideoMutation, { name: 'subtitleVideo' })(VideoList)
);

export default connect(undefined, dispatch => ({
  jobStart: id => dispatch(actions.jobStart(id)),
  newVideos: () => dispatch(actions.newVideos())
}))(VideoListWithData);
