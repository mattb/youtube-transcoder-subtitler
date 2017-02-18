import React from 'react';
import gql from 'graphql-tag';
import { graphql } from 'react-apollo';
import parse from 'url-parse';

const fetchVideo = gql`
mutation fetchVideo($id: String!) {
  download(id:$id) {
    id
    url
    title
    thumbnail
  }
}
`;

class VideoDownloader extends React.Component {
  constructor() {
    super();
    this.submit = e => {
      const url = parse(this.id.value, true);
      this.props.onUploadBegin();
      this.props.mutate({
        variables: {
          id: url.query.v
        }
      }).then(result => {
        this.props.onUpload();
        console.log('RESULT', this.id.value, result);
      });
      this.id.value = '';
      e.preventDefault();
    };
  }
  render() {
    return (
      <form onSubmit={this.submit}>
        Id: <input
          type="text"
          name="id"
          ref={i => {
            this.id = i;
          }}
        />
      </form>
    );
  }
}
VideoDownloader.propTypes = {
  mutate: React.PropTypes.func.isRequired,
  onUpload: React.PropTypes.func.isRequired,
  onUploadBegin: React.PropTypes.func.isRequired
};

export default graphql(fetchVideo)(VideoDownloader);
