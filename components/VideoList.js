import React from 'react';

const VideoList = ({ files }) => (
  <ul>
    {files.map(file => (
      <li key={file.id}>
        <p>
          <a href={file.url} download={`${file.id}.mp4`}>{file.title}</a>:
          <br /><br />
          <video
            src={file.url}
            poster={file.thumbnail}
            type="video/mp4"
            controls="true"
            style={{ width: '320px', height: '180px' }}
          />
        </p>
      </li>
    ))}
  </ul>
);

VideoList.propTypes = {
  files: React.PropTypes.arrayOf(React.PropTypes.shape({
      id: React.PropTypes.string.isRequired,
      title: React.PropTypes.string.isRequired,
      url: React.PropTypes.string.isRequired,
      thumbnail: React.PropTypes.string.isRequired
    })).isRequired
};

export default VideoList;
