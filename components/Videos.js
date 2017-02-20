import React from 'react';
import gql from 'graphql-tag';
import { graphql } from 'react-apollo';
import { connect } from 'react-redux';

import { Card, CardTitle, CardText } from 'react-md/lib/Cards';

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
    thumbnail
  }
}
`;

class Videos extends React.Component {
  componentWillReceiveProps({ data, working }) {
    if (this.props.working && !working) {
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
            Paste the YouTube URL here and press <em>enter</em>:

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
  job_id: React.PropTypes.number
};

Videos.defaultProps = {
  job_id: undefined
};

export default connect(
  state => {
    const jobState = {
      working: state.jobqueue.job_ids.length > 0
    };
    if (jobState.working) {
      return Object.assign({}, jobState, {
        job_id: state.jobqueue.job_ids[0]
      });
    }
    return jobState;
  },
  undefined
)(graphql(videoQuery)(Videos));
