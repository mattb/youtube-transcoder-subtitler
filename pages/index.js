import React from 'react';
import withData from '../lib/withData';

import VideoList from '../components/VideoList';
import VideoDownloader from '../components/VideoDownloader';

const Index = () => (
  <div>
    <VideoDownloader />
    <VideoList />
  </div>
);

export default withData(() => <Index />);
