import React from 'react';
import gql from 'graphql-tag';
import { graphql } from 'react-apollo';
import { connect } from 'react-redux';
import parse from 'url-parse';

const fetchVideo = gql`
mutation fetchVideo($id: String!) {
  enqueueDownload(id:$id) {
    id
  }
}
`;

class VideoDownloader extends React.Component {
  constructor() {
    super();
    this.submit = e => {
      const url = parse(this.id.value, true);
      this.props.mutate({
        variables: {
          id: url.query.v
        }
      }).then(({ data }) => {
        this.props.jobStart(data.enqueueDownload.id);
      });
      this.id.value = '';
      e.preventDefault();
    };
  }
  render() {
    console.log('VIDEO DOWNLOADER', this.props);
    return (
      <div>
        <form onSubmit={this.submit}>
          <input
            type="text"
            name="id"
            ref={i => {
              this.id = i;
            }}
          />
        </form>
      </div>
    );
  }
}
VideoDownloader.propTypes = {
  mutate: React.PropTypes.func.isRequired,
  jobStart: React.PropTypes.func.isRequired
};

export default connect(undefined, dispatch => ({
  jobStart: id => dispatch({ type: 'JOB_START', payload: id })
}))(graphql(fetchVideo)(VideoDownloader));
