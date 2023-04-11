# Exactly

[App](https://app.exact.ly) - [Twitter](https://twitter.com/ExactlyProtocol) - [Discord](https://exact.ly/discord)

Decentralizing the credit market, today.

Exactly is a decentralized, non-custodial and open-source protocol that provides
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
NEXT_PUBLIC_NETWORK=goerli        # Network to use by default
NEXT_PUBLIC_ENABLE_TESTNETS=true  # Enable testnets (required if NETWORK is a tesnet)
```

A development server can be started at `http://localhost:3000` with

```bash
npm run dev
```

## Testing

We use the Cypress testing framework
to run our E2E tests and [Tenderly](https://tenderly.co/) to setup forks.

The following environment variables are required to be present for the tests to
work as expected

```bash
CYPRESS_TENDERLY_ACCESS_KEY=<tenderly access token>
CYPRESS_TENDERLY_PROJECT=<tenderly project>
CYPRESS_TENDERLY_USER=<tenderly user>
```

The full suite can be run using

```bash
npm run ci
```

the command above will setup a production server and run tests on it.
Which is the same as running

```bash
npm run start:e2e             # Or `npm run dev:e2e` for a dev server
```

and in another terminal

```bash
npm run test
```

To run a single test use the same above but specifiy the spec to run with

```bash
npm run test -- --spec [path] # e.g. tests/e2e/specs/0-connect-wallet-spec.ts
```

Use the `--headed` flag to open the Cypress instance.

## i18n

Use the `t` utility function on all strings present in the app.
The function can be obtained by calling `useTranslation` on functional components,
or by importing the `i18n` instance. The later should always be used in functions
(or any code that can be re-evaluated), do not use it at global scope as once it
gets executed the string value will not be updated if a language change happens.

Translations can be found in `i18n/`. New entries are added via executing

```bash
npm run i18n:scan
```

The script will scan the whole project in search of `t` usages, adding the newly
discovered to the translation file and removing unused keys. Be sure to provide
a translation or remove the entry to default to the english key used.

## Deployment

We use Vercel. New pull requests will be deployed will receive previews deployed
to be reviewed.

Any code merged to `main` will be immediately deployed to production.

## License

Licensed under the [BUSL-1.1 License](./LICENSE).
