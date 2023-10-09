# Exactly Protocol

[App](https://app.exact.ly) - [Twitter](https://twitter.com/ExactlyProtocol) - [Discord](https://exact.ly/discord)

Decentralizing the credit market, today.

Exactly Protocol is a decentralized, non-custodial and open-source protocol that provides
an autonomous fixed and variable interest rate market enabling users to
frictionlessly exchange the time value of their assets and completing the DeFi
credit market.

## Getting started

Clone the repository

```bash
git clone git@github.com:exactly/app.git
```

and install its dependencies with

```bash
npm install
```

## Running the app locally

The app can be started locally with

```bash
npm run dev
```

and the instance should be accessible at `http://localhost:3000`.

## Development

An environment file is required to be created as `.env` in the root of the
project with the following content

```bash
NEXT_PUBLIC_NETWORK=5  # Network to use by default
```

A development server can be started at `http://localhost:3000` with

```bash
npm run dev
```

## Testing

We use Playwright testing framework
to run our E2E tests and [Tenderly](https://tenderly.co/) to setup forks.

The following environment variables are required to be present for the tests to
work as expected

```bash
TENDERLY_ACCESS_KEY=<tenderly access token>
TENDERLY_PROJECT=<tenderly project>
TENDERLY_USER=<tenderly user>
```

The full suite can be run using

```bash
npm run start:e2e             # Or `npm run dev:e2e` for a dev server
```

to start the app and in another terminal

```bash
npm run test
```

To run a single test use the same above but specifiy the spec to run with

```bash
npm run test -- [spec path] # e.g. e2e/specs/0-enter-exit-market/weth.spec.ts
```

Use the `--headed` flag to review the test running in the browser.

## Deployment

We use Vercel. New pull requests will be deployed will receive previews deployed
to be reviewed.

Any code merged to `main` will be immediately deployed to production.

## License

Licensed under the [BUSL-1.1 License](./LICENSE).
