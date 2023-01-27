<p align="center">
  <a href="https://app.exact.ly">
    <picture>
      <source media="(prefers-color-scheme: dark)" srcset="https://app.exact.ly/img/isologo-white.svg">
      <img src="https://app.exact.ly/img/isologo.svg" width="100">
    </picture>
    <h1 align="center">Exactly</h1>
  </a>
</p>
<p align="center">
<a href="https://app.exact.ly">App</a> - <a href="https://twitter.com/ExactlyProtocol">Twitter</a> - <a href="https://exact.ly/discord">Discord</a>
</p>
<p align="center">
  <strong>
     Decentralizing the time-value of money
  </strong>
</p>
<p align="center">
Exactly is a decentralized, non-custodial and open-source protocol that provides an autonomous fixed and variable interest rate market enabling users to frictionlessly exchange the time value of their assets and completing the DeFi credit market.
</p>

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

An environment file is required to be created as `.env` in the root of the project with the following content

```bash
NEXT_PUBLIC_NETWORK=goerli  		# Network to use by default
NEXT_PUBLIC_ENABLE_TESTNETS=true	# Enable testnets (required if NEXT_PUBLIC_NETWORK is a tesnet)
```

A development server can be started at `http://localhost:3000` with

```bash
npm run dev
```

## Deployment

We use Vercel. New pull requests will be deployed will receive previews deployed to be reviewed.

Any code merged to `main` will be immediately deployed to production.

## License

Licensed under the [BUSL-1.1 License](./LICENSE).
