import React from 'react';
import type { NextPage } from 'next';
import * as Sentry from '@sentry/nextjs';
import NextErrorComponent from 'next/error';

type Props = {
  statusCode: number;
};

const CustomErrorComponent: NextPage<Props> = ({ statusCode }: Props) => <NextErrorComponent statusCode={statusCode} />;

CustomErrorComponent.getInitialProps = async (contextData) => {
  // In case this is running in a serverless function, await this in order to give Sentry
  // time to send the error before the lambda exits
  await Sentry.captureUnderscoreErrorException(contextData);

  // This will contain the status code of the response
  return NextErrorComponent.getInitialProps(contextData);
};

export default CustomErrorComponent;
