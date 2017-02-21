import React from 'react';
import gql from 'graphql-tag';
import { graphql } from 'react-apollo';
import { connect } from 'react-redux';

import { Card, CardTitle, CardText } from 'react-md/lib/Cards';
import LinearProgress from 'react-md/lib/Progress/LinearProgress';

import actions from '../lib/actions';

const jobQuery = gql`
query Job($id:Int!) {
  job(id: $id) {
    id
    state
    progress
    progress_data
    type
    created_at
  }
}
`;

class Job extends React.Component {
  componentDidMount() {
    this.refetchInterval = setInterval(
      () => {
        this.props.data.refetch();
      },
      1000
    );
  }
  componentWillReceiveProps(nextProps) {
    const oldData = this.props.data;
    const { data, jobFinished } = nextProps;
    if (
      !data.loading &&
        data.job.state === 'complete' &&
        data.job.state !== oldData.job.state
    ) {
      jobFinished(data.job.id);
    }
  }
  componentWillUnmount() {
    clearInterval(this.refetchInterval);
    delete this.refetchInterval;
  }
  render() {
    const { data } = this.props;
    return (
      <Card className="md-cell">
        <CardTitle title="I'm working on it..." />
        {!data.loading &&
          <div>
            <LinearProgress
              query
              key="progress"
              id="working"
              value={data.job.progress && parseInt(data.job.progress, 10)}
            />
            <CardText>
              {data.job.progress_data}
            </CardText>
          </div>}
      </Card>
    );
  }
}
Job.propTypes = {
  data: React.PropTypes.shape({
    loading: React.PropTypes.bool.isRequired,
    refetch: React.PropTypes.func.isRequired
  }).isRequired,
  jobFinished: React.PropTypes.func.isRequired
};

const JobWithData = graphql(jobQuery)(Job);

export default connect(undefined, dispatch => ({
  jobFinished: id => dispatch(actions.jobFinishWithNewVideos(id))
}))(JobWithData);
