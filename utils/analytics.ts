import Analytics from 'analytics';
import googleAnalytics from '@analytics/google-analytics';

const { NEXT_PUBLIC_GOOGLE_ANALYTICS } = process.env;

const analytics = Analytics({
  plugins: [
    NEXT_PUBLIC_GOOGLE_ANALYTICS &&
      googleAnalytics({
        measurementIds: NEXT_PUBLIC_GOOGLE_ANALYTICS,
      }),
  ].filter(Boolean),
});

export default analytics;
