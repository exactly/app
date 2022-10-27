import React from 'react';
import Navbar from 'components/Navbar';
import ErrorPageMessage from 'components/ErrorPageMessage';

export default function Custom404() {
  return (
    <section>
      <Navbar />
      <ErrorPageMessage
        code={404}
        description={'Page Not Found'}
        message={'The page you are looking for is not available.'}
      />
    </section>
  );
}
