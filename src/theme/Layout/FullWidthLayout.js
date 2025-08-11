import React from 'react';
import Layout from '@theme/Layout';

function FullWidthLayout(props) {
  return (
    <Layout {...props}>
      <div style={{ width: '100%', maxWidth: 'none', padding: '0' }}>
        {props.children}
      </div>
    </Layout>
  );
}

export default FullWidthLayout;
