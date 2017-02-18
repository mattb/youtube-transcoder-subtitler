import React from 'react';
import gql from 'graphql-tag';
import { graphql } from 'react-apollo';

import { Card, CardTitle, CardText, CardActions } from 'react-md/lib/Cards';
import CircularProgress from 'react-md/lib/Progress/CircularProgress';

import Log from '../components/Log';
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
    let downloader = <span />;
    if (this.state.working) {
      working = (
        <Card className="md-cell">
          <CardTitle title="I'm working on it..." />
          <CircularProgress key="progress" id="working" />
          <CardText>
            <Log url="/stream" />
          </CardText>
        </Card>
      );
    } else {
      downloader = (
        <Card className="md-cell">
          <CardTitle title="Download a video" />
          <CardText>
            Paste the YouTube URL here and press <em>enter</em>:


            <VideoDownloader
              onUpload={this.updated}
              onUploadBegin={this.startSpinner}
            />
          </CardText>
        </Card>
      );
    }
    if (data.loading) {
      return (
        <div className="md-grid">
          <Card className="md-cell">
            <CardTitle title="Loading..." />
          </Card>
        </div>
      );
    }
    return (
      <div>
        <div className="md-grid">
          {downloader}
          {working}
        </div>
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
