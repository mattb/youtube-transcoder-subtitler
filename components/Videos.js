import React from 'react';
import gql from 'graphql-tag';
import { graphql } from 'react-apollo';

import VideoList from '../components/VideoList';
import VideoDownloader from '../components/VideoDownloader';

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

class Videos extends React.Component {
  constructor() {
    super();
    this.state = { working: false };
    this.startSpinner = () => {
      this.setState({ working: true });
    };
    this.updated = () => {
      this.setState({ working: false });
      this.props.data.refetch();
    };
  }

  render() {
    const { data } = this.props;
    let working = <span />;
    if (this.state.working) {
      working = (
        <img
          src="http://thinkfuture.com/wp-content/uploads/2013/10/loading_spinner.gif"
          alt="working"
          style={{ float: 'right' }}
        />
      );
    }
    if (data.loading) {
      return (
        <div>
          {working}
          <VideoDownloader
            onUpload={this.updated}
            onUploadBegin={this.startSpinner}
          />
        </div>
      );
    }
    return (
      <div>
        {working}
        <VideoDownloader
          onUpload={this.updated}
          onUploadBegin={this.startSpinner}
        />
        <VideoList files={data.files} />
      </div>
    );
  }
}

Videos.propTypes = {
  data: React.PropTypes.shape({
    loading: React.PropTypes.bool.isRequired,
    refetch: React.PropTypes.func.isRequired
  }).isRequired
};

export default graphql(videoQuery)(Videos);
