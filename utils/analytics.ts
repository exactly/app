import Analytics from 'analytics';
import googleAnalytics from '@analytics/google-analytics';

const analytics = Analytics({
  plugins: [
    googleAnalytics({
      measurementIds: process.env.NEXT_PUBLIC_GOOGLE_ANALYTICS,
    }),
  ],
});

export default analytics;
