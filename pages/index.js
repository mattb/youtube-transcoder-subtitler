import React from 'react';
import gql from 'graphql-tag';
import { graphql } from 'react-apollo';
import withData from '../lib/withData';

const indexQuery = gql`
query Files {
  files {
    id
    url
    name
  }
}
`;

const Index = ({ data }) => {
  if (data.loading) {
    return <div>Hello world!</div>;
  }
  return (
    <ul>
      {data.files.map(file => <li key={file.id}>{file.name}</li>)}
    </ul>
  );
};

Index.propTypes = {
  data: React.PropTypes.shape({
    loading: React.PropTypes.bool.isRequired
  }).isRequired
};

const IndexWithQuery = graphql(indexQuery)(Index);

export default withData(() => <IndexWithQuery />);
