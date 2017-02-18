import React from 'react';
import withData from '../lib/withData';

import Videos from '../components/Videos';
import Log from '../components/Log';

const Index = () => (
  <div>
    <Log url="/stream" />
    <Videos />
  </div>
);

export default withData(() => <Index />);
