import React from 'react';
import gql from 'graphql-tag';
import { graphql } from 'react-apollo';

import { Card, CardTitle, CardText, CardActions } from 'react-md/lib/Cards';

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
          <CardTitle title="Progress log" />
          <img
            src="http://thinkfuture.com/wp-content/uploads/2013/10/loading_spinner.gif"
            alt="working"
            style={{ float: 'right', width: '50px', height: '50px' }}
          />
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
          </CardText>
          <CardActions>
            <VideoDownloader
              onUpload={this.updated}
              onUploadBegin={this.startSpinner}
            />
          </CardActions>
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
