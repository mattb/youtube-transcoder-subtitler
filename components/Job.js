import React from 'react';
import gql from 'graphql-tag';
import { graphql } from 'react-apollo';
import { connect } from 'react-redux';

import { Card, CardTitle, CardText } from 'react-md/lib/Cards';
import LinearProgress from 'react-md/lib/Progress/LinearProgress';

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
  componentWillReceiveProps(nextProps) {
    const { data, jobFinished } = nextProps;
    if (!data.loading && data.job.state === 'complete') {
      jobFinished(data.job.id);
    }
  }
  render() {
    const { data } = this.props;
    return (
      <Card className="md-cell">
        <CardTitle title="I'm working on it..." />
        {!data.loading &&
          <div>
            <LinearProgress
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
    loading: React.PropTypes.bool.isRequired
  }).isRequired,
  jobFinished: React.PropTypes.func.isRequired
};

export default connect(undefined, dispatch => ({
  jobFinished: id => dispatch({ type: 'JOB_FINISH', payload: id })
}))(graphql(jobQuery, {
    options: { pollInterval: 1000 }
  })(Job));
