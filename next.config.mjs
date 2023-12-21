import { withSentryConfig } from '@sentry/nextjs';

const DISABLE_SENTRY_PLUGIN = JSON.parse(process.env.DISABLE_SENTRY_PLUGIN ?? 'false');

export default withSentryConfig(
  {
    reactStrictMode: true,
    productionBrowserSourceMaps: true,
    redirects: () => [
      { source: '/markets', destination: '/', permanent: true },
      { source: '/assets/:symbol*', destination: '/:symbol*', permanent: true },
    ],
    async rewrites() {
      return [
        {
          source: '/api/a-cdn/:path*',
          destination: 'https://cdn.segment.com/:path*',
        },
        {
          source: '/api/a-api/:path*',
          destination: 'https://api.segment.io/v1/:path*',
        },
      ];
    },

    headers: () => [
      {
        source: '/:path*',
        headers: [
          { key: 'X-DNS-Prefetch-Control', value: 'on' },
          { key: 'X-XSS-Protection', value: '1; mode=block' },
          { key: 'Strict-Transport-Security', value: 'max-age=604800' },
          { key: 'Content-Security-Policy', value: 'frame-ancestors https://app.safe.global' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(), interest-cohort=()' },
          { key: 'Access-Control-Allow-Origin', value: '*' },
          { key: 'Access-Control-Allow-Methods', value: 'GET' },
          { key: 'Access-Control-Allow-Headers', value: 'X-Requested-With, content-type, Authorization' },
        ],
      },
    ],

    images: { unoptimized: true },
  },
  {
    silent: true,
    org: 'exactly',
    project: 'webapp',
  },
  {
    disableServerWebpackPlugin: DISABLE_SENTRY_PLUGIN,
    disableClientWebpackPlugin: DISABLE_SENTRY_PLUGIN,
    widenClientFileUpload: true,
    hideSourceMaps: true,
    disableLogger: true,
  },
);
