import React from 'react';
import Media from 'react-md/lib/Media/Media';
import gql from 'graphql-tag';
import { graphql } from 'react-apollo';
import { connect } from 'react-redux';
import { Card, CardTitle, CardActions } from 'react-md/lib/Cards';
import { Button } from 'react-md/lib/Buttons';

const subtitleVideo = gql`
mutation subtitleVideo($id: String!) {
  enqueueSubtitle(id:$id) {
    id
  }
}
`;

const VideoList = ({ files, mutate, jobStart, hideButtons }) => (
  <div className="md-grid">
    {files.map(file => (
      <Card className="md-cell" key={file.id}>
        <CardTitle title={file.title} />
        <Media>
          <video
            src={file.url}
            poster={file.thumbnail}
            type="video/mp4"
            controls="true"
            style={{ width: '320px', height: '180px' }}
          />
        </Media>
        {file.subtitled_url &&
          <Media>
            <h4>Subtitled version:</h4>
            <video
              src={file.subtitled_url}
              poster={file.thumbnail}
              type="video/mp4"
              controls="true"
              style={{ width: '320px', height: '180px' }}
            />
          </Media>}
        {!hideButtons &&
          !file.subtitled_url &&
          <CardActions>
            <Button
              raised
              label="Subtitle it!"
              onClick={() => mutate({
                variables: {
                  id: file.id
                }
              }).then(({ data }) => {
                jobStart(data.enqueueSubtitle.id);
              })}
            />
          </CardActions>}
      </Card>
    ))}
  </div>
);

VideoList.propTypes = {
  hideButtons: React.PropTypes.boolean,
  files: React.PropTypes.arrayOf(React.PropTypes.shape({
      id: React.PropTypes.string.isRequired,
      title: React.PropTypes.string.isRequired,
      url: React.PropTypes.string.isRequired,
      thumbnail: React.PropTypes.string.isRequired
    })).isRequired,
  mutate: React.PropTypes.func.isRequired,
  jobStart: React.PropTypes.func.isRequired
};
VideoList.defaultProps = {
  hideButtons: false
};

export default connect(undefined, dispatch => ({
  jobStart: id => dispatch({ type: 'JOB_START', payload: id })
}))(graphql(subtitleVideo)(VideoList));
