import { extraErrorDataIntegration } from '@sentry/core';
import { init } from '@sentry/nextjs';
import { beforeSend } from './utils/sentry';

const SENTRY_DSN = process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN;
const SENTRY_ENVIRONMENT = process.env.SENTRY_ENVIRONMENT || process.env.NEXT_PUBLIC_SENTRY_ENVIRONMENT;

init({
  dsn: SENTRY_DSN,
  environment: SENTRY_ENVIRONMENT,
  tracesSampleRate: 0,
  integrations: [extraErrorDataIntegration({ depth: 5 })],
  beforeSend,
});
