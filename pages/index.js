import React from 'react';
import withData from '../lib/withData';

import Videos from '../components/Videos';

const Index = () => <Videos />;

export default withData(() => <Index />);
