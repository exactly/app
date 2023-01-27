import React from 'react';
import ErrorPageMessage from 'components/ErrorPageMessage';

export default function Custom500() {
  return (
    <ErrorPageMessage
      code={500}
      description={'Internal Server Error'}
      message={'The page you are looking for is not available.'}
    />
  );
}
