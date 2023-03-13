import Analytics, { AnalyticsInstance } from 'analytics';
import googleAnalytics from '@analytics/google-analytics';
import { mainnet, optimism } from '@wagmi/chains';

const analyticsMainnet = Analytics({
  plugins: [
    process.env.NEXT_PUBLIC_GOOGLE_ANALYTICS &&
      googleAnalytics({
        measurementIds: process.env.NEXT_PUBLIC_GOOGLE_ANALYTICS,
      }),
  ].filter(Boolean),
});

const analyticsOptimism = Analytics({
  plugins: [
    process.env.NEXT_PUBLIC_GOOGLE_ANALYTICS_OPTIMISM &&
      googleAnalytics({
        measurementIds: process.env.NEXT_PUBLIC_GOOGLE_ANALYTICS_OPTIMISM,
      }),
  ].filter(Boolean),
});

const analytics: Record<number, AnalyticsInstance> = {
  [mainnet.id]: analyticsMainnet,
  [optimism.id]: analyticsOptimism,
};

export default analytics;
