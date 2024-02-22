import { Html, Head, Main, NextScript } from "next/document";

export default function Document() {
  return (
    <Html lang="en">
      <Head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@100;200;300;400;500;600;700&family=Inter:wght@100;200;300;400;500;600;700&&family=Bebas+Neue:wght@400&display=swap"
          rel="stylesheet"
        />
        <meta property="og:title" content="Exa App" />
        <meta
          property="og:description"
          content="Deposit and borrow on-chain. The first self-custodial debit and credit card."
        />
        <meta
          property="og:image"
          content="https://exactly.app/opengraph-image.png"
        />
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
