import { withSentryConfig } from '@sentry/nextjs';

const DISABLE_SENTRY_PLUGIN = JSON.parse(process.env.DISABLE_SENTRY_PLUGIN ?? 'false');

export default withSentryConfig({
  reactStrictMode: true,
  productionBrowserSourceMaps: true,
  sentry: {
    widenClientFileUpload: true,
    hideSourceMaps: false,
    disableServerWebpackPlugin: DISABLE_SENTRY_PLUGIN,
    disableClientWebpackPlugin: DISABLE_SENTRY_PLUGIN,
  },

  redirects: () => [
    { source: '/markets', destination: '/', permanent: true },
    { source: '/assets/:symbol*', destination: '/:symbol*', permanent: true },
  ],

  headers: () => [
    {
      source: '/:path*',
      headers: [
        { key: 'X-DNS-Prefetch-Control', value: 'on' },
        { key: 'X-XSS-Protection', value: '1; mode=block' },
        { key: 'Content-Security-Policy', value: 'frame-ancestors https://app.safe.global' },
        { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(), interest-cohort=()' },
        { key: 'X-Content-Type-Options', value: 'nosniff' },
        { key: 'Referrer-Policy', value: 'strict-origin' },
        { key: 'Access-Control-Allow-Origin', value: '*' },
        { key: 'Access-Control-Allow-Methods', value: 'GET' },
        { key: 'Access-Control-Allow-Headers', value: 'X-Requested-With, content-type, Authorization' },
      ],
    },
  ],

  images: { unoptimized: true },

  experimental: { appDir: true },
});
