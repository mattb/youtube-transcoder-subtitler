import React from 'react';
import gql from 'graphql-tag';
import { graphql } from 'react-apollo';

const videoQuery = gql`
query Files {
  files {
    id
    url
    title
    thumbnail
  }
}
`;

const VideoList = ({ data }) => {
  if (data.loading) {
    return <div>Loading...</div>;
  }
  return (
    <ul>
      {data.files.map(file => (
        <li key={file.id}>
          <p>
            {file.title}: <br />
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
};

VideoList.propTypes = {
  data: React.PropTypes.shape({
    loading: React.PropTypes.bool.isRequired
  }).isRequired
};

export default graphql(videoQuery)(VideoList);
