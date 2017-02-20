import React from 'react';
import gql from 'graphql-tag';
import { graphql } from 'react-apollo';
import { connect } from 'react-redux';
import parse from 'url-parse';
import TextField from 'react-md/lib/TextFields';

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
      e.preventDefault();
      const field = this.urlField.getField();
      const url = parse(field.value, true);
      field.value = '';
      this.props.mutate({
        variables: {
          id: url.query.v
        }
      }).then(({ data }) => {
        this.props.jobStart(data.enqueueDownload.id);
      });
    };
  }
  render() {
    return (
      <div>
        <form onSubmit={this.submit}>
          <TextField
            id="url"
            ref={field => {
              this.urlField = field;
            }}
            label="Paste the YouTube URL here"
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
