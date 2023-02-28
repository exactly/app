import '../styles/globals.css';
import '../styles/variables.css';

import React from 'react';
import Head from 'next/head';
import { Web3Modal } from '@web3modal/react';
import { WagmiConfig } from 'wagmi';
import type { AppProps } from 'next/app';
import { Box } from '@mui/material';
import { ThemeProvider as MUIThemeProvider } from '@mui/material/styles';

import { ModalStatusProvider } from 'contexts/ModalStatusContext';
import { MarketProvider } from 'contexts/MarketContext';
import { AccountDataProvider } from 'contexts/AccountDataContext';
import { ThemeProvider } from 'contexts/ThemeContext';
import { defaultChain, wagmi, walletConnectId, web3modal } from 'utils/client';
import Footer from 'components/Footer';
import Navbar from 'components/Navbar';
import theme, { globals } from 'styles/theme';
import { MarketsBasicProvider } from 'contexts/MarketsBasicContext';

const { maxWidth } = globals;

export default function App({ Component, pageProps }: AppProps) {
  return (
    <>
      <Head>
        <title>Exactly - Decentralizing the time-value of money</title>
        <meta
          name="description"
          content="Exactly is a decentralized, non-custodial and open-source protocol that provides an autonomous fixed and variable interest rate market enabling users to exchange the time value of their assets and completing the DeFi credit market."
        />
        <link rel="icon" href="/icon.ico" />

        <meta property="og:url" content="https://app.exact.ly" />
        <meta property="og:type" content="website" />
        <meta property="og:title" content="Exactly - Decentralizing the time-value of money" />
        <meta
          property="og:description"
          content="Exactly is a decentralized, non-custodial and open-source protocol that provides an autonomous fixed and variable interest rate market enabling users to exchange the time value of their assets and completing the DeFi credit market."
        />
        <meta property="og:image" content="https://app.exact.ly/img/social/ogp.png" />
        <meta property="og:image:secure_url" content="https://app.exact.ly/img/social/ogp.png" />
        <meta property="og:image:type" content="image/png" />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />

        <meta name="twitter:card" content="summary_large_image" />
        <meta property="twitter:domain" content="exact.ly" />
        <meta property="twitter:url" content="https://exact.ly" />
        <meta name="twitter:title" content="Exactly - Decentralizing the time-value of money" />
        <meta
          name="twitter:description"
          content="Exactly is a decentralized, non-custodial and open-source protocol that provides an autonomous fixed and variable interest rate market enabling users to exchange the time value of their assets and completing the DeFi credit market."
        />
        <meta name="twitter:image" content="https://app.exact.ly/img/social/ogp.png" />
      </Head>
      <ThemeProvider>
        <MUIThemeProvider theme={theme}>
          <WagmiConfig client={wagmi}>
            <AccountDataProvider>
              <MarketProvider>
                <ModalStatusProvider>
                  <MarketsBasicProvider>
                    <Box display="flex" flexDirection="column" mx={1} height="100%">
                      <Navbar />
                      <main style={{ flexGrow: 1, maxWidth, margin: '0 auto' }}>
                        <Component {...pageProps} />
                      </main>
                      <Footer />
                    </Box>
                  </MarketsBasicProvider>
                </ModalStatusProvider>
              </MarketProvider>
            </AccountDataProvider>
          </WagmiConfig>
          <Web3Modal
            projectId={walletConnectId}
            defaultChain={defaultChain}
            ethereumClient={web3modal}
            themeMode="light"
            themeColor="blackWhite"
            themeBackground="themeColor"
            walletImages={{ safe: '/img/wallets/safe.png' }}
            chainImages={{ 1: '/img/networks/1.svg' }}
          />
        </MUIThemeProvider>
      </ThemeProvider>
    </>
  );
}
