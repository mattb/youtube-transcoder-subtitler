import React from 'react';
import { connect } from 'react-redux';
import parse from 'url-parse';
import TextField from 'react-md/lib/TextFields';
import { Field, reduxForm } from 'redux-form';
import actions from '../lib/actions';

const parseUrlAndSubmit = dispatchAction => ({ url }) => {
  const parsedUrl = parse(url, true);
  dispatchAction(parsedUrl.query.v);
};

const renderTextfield = ({ input, label }) => (
  <TextField {...input} id={input.name} label={label} />
);

renderTextfield.propTypes = {
  input: React.PropTypes.shape({
    name: React.PropTypes.string.isRequired
  }).isRequired,
  label: React.PropTypes.string.isRequired
};

const VideoDownloader = ({ handleSubmit, downloadVideo }) => (
  <div>
    <form onSubmit={handleSubmit(parseUrlAndSubmit(downloadVideo))}>
      <Field
        component={renderTextfield}
        name="url"
        label="Paste the YouTube URL here"
      />
    </form>
  </div>
);
VideoDownloader.propTypes = {
  handleSubmit: React.PropTypes.func.isRequired,
  downloadVideo: React.PropTypes.func.isRequired
};

export default connect(undefined, dispatch => ({
  downloadVideo: id => dispatch(actions.downloadVideo(id))
}))(reduxForm({ form: 'download' })(VideoDownloader));
