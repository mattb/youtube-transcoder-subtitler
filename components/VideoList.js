import React from 'react';
import gql from 'graphql-tag';
import { graphql } from 'react-apollo';
import { connect } from 'react-redux';
import { Card, CardText, CardActions } from 'react-md/lib/Cards';
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
        <CardText>
          <h3
            style={{
              'white-space': 'nowrap',
              overflow: 'hidden',
              'text-overflow': 'ellipsis'
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
        </CardText>
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
  hideButtons: React.PropTypes.bool,
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
