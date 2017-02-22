import React from 'react';
import { connect } from 'react-redux';
import parse from 'url-parse';
import TextField from 'react-md/lib/TextFields';
import actions from '../lib/actions';

class VideoDownloader extends React.Component {
  constructor() {
    super();
    this.submit = e => {
      e.preventDefault();
      const field = this.urlField.getField();
      const url = parse(field.value, true);
      field.value = '';
      this.props.downloadVideo(url.query.v);
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
  downloadVideo: React.PropTypes.func.isRequired
};

export default connect(undefined, dispatch => ({
  downloadVideo: id => dispatch(actions.downloadVideo(id))
}))(VideoDownloader);
