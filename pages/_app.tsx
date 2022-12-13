import '../styles/globals.css';
import '../styles/variables.css';

import React from 'react';
import Head from 'next/head';
import { Web3Modal } from '@web3modal/react';
import { WagmiConfig } from 'wagmi';
import type { AppProps } from 'next/app';

import { LangProvider } from 'contexts/LangContext';
import { ModalStatusProvider } from 'contexts/ModalStatusContext';
import { MarketProvider } from 'contexts/MarketContext';
import { AccountDataProvider } from 'contexts/AccountDataContext';
import { SkeletonTheme } from 'react-loading-skeleton';
import { ThemeProvider } from 'contexts/ThemeContext';
import { ThemeProvider as MUIThemeProvider } from '@mui/material/styles';
import { wagmi, walletConnectId, web3modal } from 'utils/client';
import theme from 'styles/theme';

export default function App({ Component, pageProps }: AppProps) {
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
            <WagmiConfig client={wagmi}>
              <AccountDataProvider>
                <MarketProvider>
                  <ModalStatusProvider>
                    <SkeletonTheme baseColor="var(--skeleton-base)" highlightColor="var(--skeleton-highlight)">
                      <Component {...pageProps} />
                    </SkeletonTheme>
                  </ModalStatusProvider>
                </MarketProvider>
              </AccountDataProvider>
            </WagmiConfig>
            <Web3Modal projectId={walletConnectId} ethereumClient={web3modal} />
          </LangProvider>
        </MUIThemeProvider>
      </ThemeProvider>
    </>
  );
}
