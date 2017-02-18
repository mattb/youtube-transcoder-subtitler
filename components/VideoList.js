import React from 'react';
import Media from 'react-md/lib/Media/Media';
import { Card, CardTitle } from 'react-md/lib/Cards';

const VideoList = ({ files }) => (
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
      </Card>
    ))}
  </div>
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
