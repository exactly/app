import React from 'react';
import ErrorPageMessage from 'components/ErrorPageMessage';

export default function Custom404() {
  return (
    <ErrorPageMessage
      code={404}
      description={'Page Not Found'}
      message={'The page you are looking for is not available.'}
    />
  );
}
