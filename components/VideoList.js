import React from 'react';
import { connect } from 'react-redux';
import { Card, CardText } from 'react-md/lib/Cards';
import { Button } from 'react-md/lib/Buttons';
import actions from '../lib/actions';

const VideoList = ({ files, deleteFile, subtitleVideo, hideButtons }) => (
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
          <h5>
            {file.uploader}
          </h5>
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
              onClick={() => subtitleVideo(file.id)}
            />}
          <Button
            raised
            label="Delete it!"
            onClick={() => deleteFile(file.id)}
          />
        </CardText>
      </Card>
    ))}
  </div>
);

VideoList.propTypes = {
  hideButtons: React.PropTypes.bool,
  files: React.PropTypes.arrayOf(
    React.PropTypes.shape({
      id: React.PropTypes.string.isRequired,
      title: React.PropTypes.string.isRequired,
      url: React.PropTypes.string.isRequired,
      thumbnail: React.PropTypes.string.isRequired
    })
  ).isRequired,
  deleteFile: React.PropTypes.func.isRequired,
  subtitleVideo: React.PropTypes.func.isRequired
};
VideoList.defaultProps = {
  hideButtons: false
};

export default connect(undefined, dispatch => ({
  deleteFile: id => dispatch(actions.deleteFile(id)),
  subtitleVideo: id => dispatch(actions.subtitleVideo(id))
}))(VideoList);
