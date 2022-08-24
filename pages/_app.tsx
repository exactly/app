import '../styles/globals.css';
import '../styles/variables.css';

import type { AppProps } from 'next/app';
import Head from 'next/head';
import Script from 'next/script';

import { Web3ContextProvider } from 'contexts/Web3Context';
import { LangProvider } from 'contexts/LangContext';
import { ModalStatusProvider } from 'contexts/ModalStatusContext';
import { AddressProvider } from 'contexts/AddressContext';
import { PreviewerProvider } from 'contexts/PreviewerContext';
import { AccountDataProvider } from 'contexts/AccountDataContext';
import { FixedLenderProvider } from 'contexts/FixedLenderContext';

function MyApp({ Component, pageProps }: AppProps) {
  const props = { ...pageProps };

  return (
    <>
      <Script
        id="gtagSrcId"
        strategy="lazyOnload"
        src={`https://www.googletagmanager.com/gtag/js?id=${process.env.NEXT_PUBLIC_GOOGLE_ANALYTICS}`}
      />
      <Script id="gtagScript" strategy="lazyOnload">
        {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', '${process.env.NEXT_PUBLIC_GOOGLE_ANALYTICS}');
            `}
      </Script>
      <Head>
        <title>Exactly App - Decentralizing the time value of money</title>
        <meta name="description" content="Exactly App - Decentralizing the time value of money" />
        <link rel="icon" href="/icon.ico" />
      </Head>
      <LangProvider value={'en'}>
        <Web3ContextProvider>
          <PreviewerProvider>
            <AccountDataProvider>
              <FixedLenderProvider>
                <AddressProvider>
                  <ModalStatusProvider>
                    <Component {...props} />
                  </ModalStatusProvider>
                </AddressProvider>
              </FixedLenderProvider>
            </AccountDataProvider>
          </PreviewerProvider>
        </Web3ContextProvider>
      </LangProvider>
    </>
  );
}

export default MyApp;
