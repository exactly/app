import '../styles/globals.css';
import '../styles/variables.css';

import type { AppProps } from 'next/app';
import Head from 'next/head';
// import Script from 'next/script';
import React from 'react';

import { Web3ContextProvider } from 'contexts/Web3Context';
import { LangProvider } from 'contexts/LangContext';
import { ModalStatusProvider } from 'contexts/ModalStatusContext';
import { MarketProvider } from 'contexts/MarketContext';
import { PreviewerProvider } from 'contexts/PreviewerContext';
import { AccountDataProvider } from 'contexts/AccountDataContext';
import { FixedLenderProvider } from 'contexts/FixedLenderContext';
import { AuditorProvider } from 'contexts/AuditorContext';
import { SkeletonTheme } from 'react-loading-skeleton';
import { ThemeProvider } from 'contexts/ThemeContext';
import { ContractsProvider } from 'contexts/ContractsContext';
import { ThemeProvider as MUIThemeProvider } from '@mui/material/styles';
import theme from 'styles/theme';

function MyApp({ Component, pageProps }: AppProps) {
  const props = { ...pageProps };

  return (
    <>
      {/* <Script
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
      </Script> */}
      <Head>
        <title>Exactly App - Decentralizing the time value of money</title>
        <meta name="description" content="Exactly App - Decentralizing the time value of money" />
        <link rel="icon" href="/icon.ico" />
      </Head>
      <ThemeProvider>
        <MUIThemeProvider theme={theme}>
          <LangProvider value={'en'}>
            <Web3ContextProvider>
              <PreviewerProvider>
                <ContractsProvider>
                  <AccountDataProvider>
                    <AuditorProvider>
                      <FixedLenderProvider>
                        <MarketProvider>
                          <ModalStatusProvider>
                            <SkeletonTheme baseColor="var(--skeleton-base)" highlightColor="var(--skeleton-highlight)">
                              <Component {...props} />
                            </SkeletonTheme>
                          </ModalStatusProvider>
                        </MarketProvider>
                      </FixedLenderProvider>
                    </AuditorProvider>
                  </AccountDataProvider>
                </ContractsProvider>
              </PreviewerProvider>
            </Web3ContextProvider>
          </LangProvider>
        </MUIThemeProvider>
      </ThemeProvider>
    </>
  );
}

export default MyApp;
