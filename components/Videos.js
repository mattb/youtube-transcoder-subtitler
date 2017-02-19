import React from 'react';
import gql from 'graphql-tag';
import { graphql } from 'react-apollo';
import { connect } from 'react-redux';

import { Card, CardTitle, CardText } from 'react-md/lib/Cards';
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
    console.log('VIDEOS', this.props);
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
            <a tabIndex="0" onClick={this.props.onClick}>
              Test redux {this.props.counter}
            </a>
            <br />

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
  onClick: React.PropTypes.func.isRequired,
  data: React.PropTypes.shape({
    loading: React.PropTypes.bool.isRequired,
    refetch: React.PropTypes.func.isRequired
  }).isRequired
};

export default connect(
  state => ({
    counter: state.counter
  }),
  dispatch => ({
    onClick: () => dispatch({ type: 'INCREMENT' })
  })
)(graphql(videoQuery)(Videos));
