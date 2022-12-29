import Analytics from 'analytics';
import googleAnalytics from '@analytics/google-analytics';

const analytics = Analytics({
  plugins: [
    process.env.NEXT_PUBLIC_GOOGLE_ANALYTICS &&
      googleAnalytics({
        measurementIds: process.env.NEXT_PUBLIC_GOOGLE_ANALYTICS,
      }),
  ].filter(Boolean),
});

export default analytics;
