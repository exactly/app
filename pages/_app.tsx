import '../styles/globals.css';
import '../styles/variables.css';

import type { AppProps } from 'next/app';
import Head from 'next/head';

import { AddressProvider } from 'contexts/AddressContext';
import { Web3ContextProvider } from 'contexts/Web3Context';

import { LangProvider } from 'contexts/LangContext';

function MyApp({ Component, pageProps }: AppProps) {
  const props = { ...pageProps };

  return (
    <>
      <Head>
        <title>Exactly App - Fixed interest rates lending & borrowing protocol</title>
        <meta
          name="description"
          content="Exactly App - Fixed interest rates lending & borrowing protocol"
        />
        <link rel="icon" href="/icon.ico" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="true" />
        <link
          href="https://fonts.googleapis.com/css2?family=Source+Sans+Pro:ital,wght@0,200;0,300;0,400;0,600;0,700;0,900;1,200;1,300;1,400;1,600;1,700;1,900&display=swap"
          rel="stylesheet"
        ></link>
      </Head>
      <LangProvider value={'en'}>
        <Web3ContextProvider>
          <AddressProvider>
            <Component {...props} />
          </AddressProvider>
        </Web3ContextProvider>
      </LangProvider>
    </>
  );
}

export default MyApp;
