import Analytics from 'analytics';
import googleAnalytics from '@analytics/google-analytics';

const analytics = Analytics({
  plugins: [
    googleAnalytics({
      measurementIds: 'G-2TWBJZP59Y',
    }),
  ],
});

export default analytics;
