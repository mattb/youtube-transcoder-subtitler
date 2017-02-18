import React from 'react';

const LogLine = ({ event }) => {
  if (event.message) {
    return <p>{event.message}</p>;
  }
  return <span />;
};
LogLine.propTypes = {
  event: React.PropTypes.shape({
    event: React.PropTypes.string.isRequired
  }).isRequired
};

class Log extends React.Component {
  constructor() {
    super();
    this.state = {
      events: []
    };
  }

  componentDidMount() {
    if (!global.window) {
      return;
    }
    this.source = new EventSource(this.props.url);

    const cb = type => message => {
      this.setState(prevState => {
        const newEvents = [
          Object.assign({}, JSON.parse(message.data), { event: type })
        ].concat(prevState.events);
        return {
          events: newEvents
        };
      });
    };
    this.props.types.forEach(type => {
      this.source.addEventListener(type, cb(type), false);
    });
    this.source.onerror = e => {
      console.log('EventSource::onerror: ', e);
    };
  }
  componentWillUnmount() {
    this.source.close();
  }

  render() {
    return (
      <div>
        {this.state.events.map(event => (
          <LogLine key={event.timestamp} event={event} />
        ))}
      </div>
    );
  }
}

Log.propTypes = {
  url: React.PropTypes.string.isRequired,
  types: React.PropTypes.arrayOf(React.PropTypes.string).isRequired
};
Log.defaultProps = {
  types: ['progress']
};

export default Log;
