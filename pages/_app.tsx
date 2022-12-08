import '../styles/globals.css';
import '../styles/variables.css';

import type { AppProps } from 'next/app';
import Head from 'next/head';
import React from 'react';

import { Web3ContextProvider } from 'contexts/Web3Context';
import { LangProvider } from 'contexts/LangContext';
import { ModalStatusProvider } from 'contexts/ModalStatusContext';
import { MarketProvider } from 'contexts/MarketContext';
import { AccountDataProvider } from 'contexts/AccountDataContext';
import { SkeletonTheme } from 'react-loading-skeleton';
import { ThemeProvider } from 'contexts/ThemeContext';
import { ThemeProvider as MUIThemeProvider } from '@mui/material/styles';
import theme from 'styles/theme';

function MyApp({ Component, pageProps }: AppProps) {
  return (
    <>
      <Head>
        <title>Exactly App - Decentralizing the time value of money</title>
        <meta name="description" content="Exactly App - Decentralizing the time value of money" />
        <link rel="icon" href="/icon.ico" />
      </Head>
      <ThemeProvider>
        <MUIThemeProvider theme={theme}>
          <LangProvider value={'en'}>
            <Web3ContextProvider>
              <AccountDataProvider>
                <MarketProvider>
                  <ModalStatusProvider>
                    <SkeletonTheme baseColor="var(--skeleton-base)" highlightColor="var(--skeleton-highlight)">
                      <Component {...pageProps} />
                    </SkeletonTheme>
                  </ModalStatusProvider>
                </MarketProvider>
              </AccountDataProvider>
            </Web3ContextProvider>
          </LangProvider>
        </MUIThemeProvider>
      </ThemeProvider>
    </>
  );
}

export default MyApp;
