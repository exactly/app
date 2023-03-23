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

## Deployment

We use Vercel. New pull requests will be deployed will receive previews deployed
to be reviewed.

Any code merged to `main` will be immediately deployed to production.

## License

Licensed under the [BUSL-1.1 License](./LICENSE).
