import React from 'react';
import gql from 'graphql-tag';
import { graphql } from 'react-apollo';
import { connect } from 'react-redux';

import { Card, CardTitle, CardText } from 'react-md/lib/Cards';

import { workingSelector, currentJobIdSelector } from '../lib/selectors';
import Job from '../components/Job';
import VideoList from '../components/VideoList';
import VideoDownloader from '../components/VideoDownloader';

const videoQuery = gql`
query Files {
  files {
    id
    url
    subtitled_url
    title
    uploader
    thumbnail
  }
}
`;

class Videos extends React.Component {
  componentWillReceiveProps({ data, videoListVersion }) {
    if (this.props.videoListVersion !== videoListVersion) {
      data.refetch();
    }
  }
  render() {
    const { data } = this.props;
    let working = <span />;
    let downloader = <span />;
    if (this.props.working) {
      working = <Job key={this.props.job_id} id={this.props.job_id} />;
    } else {
      downloader = (
        <Card className="md-cell">
          <CardTitle title="Download a video" />
          <CardText>
            <VideoDownloader />
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
        <VideoList files={data.files} hideButtons={this.props.working} />
      </div>
    );
  }
}

Videos.propTypes = {
  data: React.PropTypes.shape({
    loading: React.PropTypes.bool.isRequired,
    refetch: React.PropTypes.func.isRequired
  }).isRequired,
  working: React.PropTypes.bool.isRequired,
  videoListVersion: React.PropTypes.number.isRequired,
  job_id: React.PropTypes.number
};

Videos.defaultProps = {
  job_id: undefined
};

export default connect(
  state => ({
    videoListVersion: state.videos.version,
    working: workingSelector(state),
    job_id: currentJobIdSelector(state)
  }),
  undefined
)(graphql(videoQuery)(Videos));
