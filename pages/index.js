import React from 'react';
import Head from 'next/head';

import withData from '../lib/withData';
import Videos from '../components/Videos';

const Index = () => (
  <div>
    <Head>
      <link rel="icon" type="image/png" href="/static/favicon.png" />
      <link
        rel="stylesheet"
        href="/static/react-md.light_blue-yellow.min.css"
      />
    </Head>
    <div>
      <Videos />
    </div>
  </div>
);

export default withData(() => <Index />);
