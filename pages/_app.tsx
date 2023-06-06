import '../styles/globals.css';
import '../styles/variables.css';

import 'i18n';

import React from 'react';
import Head from 'next/head';
import { Web3Modal } from '@web3modal/react';
import { WagmiConfig } from 'wagmi';
import type { AppProps } from 'next/app';
import { Box, useTheme } from '@mui/material';

import { ModalStatusProvider } from 'contexts/ModalStatusContext';
import { MarketProvider } from 'contexts/MarketContext';
import { AccountDataProvider } from 'contexts/AccountDataContext';
import { ThemeProvider } from 'contexts/ThemeContext';
import { wagmi, walletConnectId, web3modal } from 'utils/client';
import Footer from 'components/Footer';
import Navbar from 'components/Navbar';
import { globals } from 'styles/theme';
import { MarketsBasicProvider } from 'contexts/MarketsBasicContext';
import { NetworkContextProvider, useNetworkContext } from 'contexts/NetworkContext';
import { DebtManagerContextProvider } from 'contexts/DebtManagerContext';
import { GlobalErrorProvider } from 'contexts/GlobalErrorContext';

const { maxWidth } = globals;

const Web3ModalWrapper = () => {
  const { palette } = useTheme();
  const { displayNetwork } = useNetworkContext();
  return (
    <Web3Modal
      projectId={walletConnectId}
      ethereumClient={web3modal}
      defaultChain={displayNetwork}
      themeMode={palette.mode}
      themeVariables={{ '--w3m-background-color': '#0D0E0F' }}
      walletImages={{ safe: '/img/wallets/safe.png' }}
      chainImages={{ 1: '/img/networks/1.svg' }}
    />
  );
};

export default function App({ Component, pageProps }: AppProps) {
  return (
    <>
      <Head>
        <title>Exactly - Decentralizing the credit market, today</title>
        <meta
          name="description"
          content="Exactly is a decentralized, non-custodial and open-source protocol that provides an autonomous fixed and variable interest rate market enabling users to exchange the time value of their assets and completing the DeFi credit market."
        />
        <link rel="icon" href="/icon.ico" />

        <meta property="og:url" content="https://app.exact.ly" />
        <meta property="og:type" content="website" />
        <meta property="og:title" content="Exactly - Decentralizing the credit market, today" />
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
        <meta name="twitter:title" content="Exactly - Decentralizing the credit market, today" />
        <meta
          name="twitter:description"
          content="Exactly is a decentralized, non-custodial and open-source protocol that provides an autonomous fixed and variable interest rate market enabling users to exchange the time value of their assets and completing the DeFi credit market."
        />
        <meta name="twitter:image" content="https://app.exact.ly/img/social/ogp.png" />
      </Head>
      <ThemeProvider>
        <WagmiConfig client={wagmi}>
          <GlobalErrorProvider>
            <NetworkContextProvider>
              <AccountDataProvider>
                <MarketProvider>
                  <ModalStatusProvider>
                    <MarketsBasicProvider>
                      <DebtManagerContextProvider>
                        <Box display="flex" flexDirection="column" mx={2} height="100%">
                          <Navbar />
                          <main style={{ flexGrow: 1, maxWidth, margin: '0 auto', width: '100%' }}>
                            <Component {...pageProps} />
                          </main>
                          <Footer />
                        </Box>
                      </DebtManagerContextProvider>
                    </MarketsBasicProvider>
                  </ModalStatusProvider>
                </MarketProvider>
              </AccountDataProvider>
              <Web3ModalWrapper />
            </NetworkContextProvider>
          </GlobalErrorProvider>
        </WagmiConfig>
      </ThemeProvider>
    </>
  );
}
