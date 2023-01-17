import { init, Replay } from '@sentry/nextjs';
import { ExtraErrorData } from '@sentry/integrations';

const SENTRY_DSN = process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN;
const SENTRY_ENVIRONMENT = process.env.SENTRY_ENVIRONMENT || process.env.NEXT_PUBLIC_SENTRY_ENVIRONMENT;

init({
  dsn: SENTRY_DSN,
  environment: SENTRY_ENVIRONMENT,
  tracesSampleRate: 1.0,
  replaysOnErrorSampleRate: 1.0,
  integrations: [new ExtraErrorData({ depth: 5 }), Replay && new Replay()].filter(Boolean),
});
