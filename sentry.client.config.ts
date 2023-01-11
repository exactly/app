import * as Sentry from '@sentry/nextjs';
import { ExtraErrorData } from '@sentry/integrations';

const SENTRY_DSN = process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN;

Sentry.init({
  dsn: SENTRY_DSN,
  tracesSampleRate: 1.0,
  integrations: [new ExtraErrorData({ depth: 5 })],
  environment: process.env.SENTRY_ENVIRONMENT,
});
