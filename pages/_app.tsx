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
import { defaultChain, wagmi, walletConnectId, web3modal } from 'utils/client';
import theme, { globals } from 'styles/theme';
import Footer from 'components/Footer';
import Navbar from 'components/Navbar';
import { Grid, useMediaQuery } from '@mui/material';

const { maxWidth } = globals;

export default function App({ Component, pageProps }: AppProps) {
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
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
                      <Grid
                        maxWidth={maxWidth}
                        display="flex"
                        flexDirection="column"
                        mx={isMobile ? 1 : 'auto'}
                        height="100%"
                      >
                        <Navbar />
                        <main style={{ flexGrow: 1 }}>
                          <Component {...pageProps} />
                        </main>
                        <Footer />
                      </Grid>
                    </SkeletonTheme>
                  </ModalStatusProvider>
                </MarketProvider>
              </AccountDataProvider>
            </WagmiConfig>
            <Web3Modal projectId={walletConnectId} ethereumClient={web3modal} defaultChain={defaultChain} />
          </LangProvider>
        </MUIThemeProvider>
      </ThemeProvider>
    </>
  );
}
