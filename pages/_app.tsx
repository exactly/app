import '../styles/globals.css';
import '../styles/variables.css';

import { useRouter } from 'next/router';
import type { AppProps } from 'next/app';
import Head from 'next/head';
import { useEffect } from 'react';

import { AddressProvider } from 'contexts/AddressContext';
import { Web3ContextProvider } from 'contexts/Web3Context';

import { LangProvider } from 'contexts/LangContext';

function MyApp({ Component, pageProps }: AppProps) {
  const props = { ...pageProps };

  const router = useRouter();

  useEffect(() => {
    const handleRouteChange = (url: URL) => {
      // @ts-ignore
      gtag.pageview(url);
    };

    router.events.on('routeChangeComplete', handleRouteChange);

    return () => {
      router.events.off('routeChangeComplete', handleRouteChange);
    };
  }, [router.events]);

  return (
    <>
      <Head>
        <title>Exactly App - Fixed interest rates lending & borrowing protocol</title>
        <meta
          name="description"
          content="Exactly App - Fixed interest rates lending & borrowing protocol"
        />
        <link rel="icon" href="/icon.ico" />
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
