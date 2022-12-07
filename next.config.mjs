import { withSentryConfig } from '@sentry/nextjs';

export default withSentryConfig({
  reactStrictMode: true,
  productionBrowserSourceMaps: true,
  sentry: { widenClientFileUpload: true, hideSourceMaps: false },

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
        { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
        { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(), interest-cohort=()' },
        { key: 'X-Content-Type-Options', value: 'nosniff' },
        { key: 'Referrer-Policy', value: 'strict-origin' },
      ],
    },
  ],
});
