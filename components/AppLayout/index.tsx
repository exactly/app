'use client';

import React, { type PropsWithChildren } from 'react';
import { WagmiConfig } from 'wagmi';
import { Box } from '@mui/material';

import { ModalStatusProvider } from 'contexts/ModalStatusContext';
import { MarketProvider } from 'contexts/MarketContext';
import { AccountDataProvider } from 'contexts/AccountDataContext';
import { ThemeProvider } from 'contexts/ThemeContext';
import { StaticContextProvider, type ContextValues as StaticContextValues } from 'contexts/StaticContext';
import { wagmi } from 'utils/client';
import Footer from 'components/Footer';
import Navbar from 'components/Navbar';
import { globals } from 'styles/theme';
import { MarketsBasicProvider } from 'contexts/MarketsBasicContext';
import { NetworkContextProvider } from 'contexts/NetworkContext';
import Web3Modal from 'components/Web3Modal';

const { maxWidth } = globals;

export default function AppLayout({ assets, children }: PropsWithChildren<StaticContextValues>) {
  return (
    <StaticContextProvider assets={assets}>
      <ThemeProvider>
        <WagmiConfig client={wagmi}>
          <NetworkContextProvider>
            <AccountDataProvider>
              <MarketProvider>
                <ModalStatusProvider>
                  <MarketsBasicProvider>
                    <Box display="flex" flexDirection="column" mx={2} height="100%">
                      <Navbar />
                      <main style={{ flexGrow: 1, maxWidth, margin: '0 auto', width: '100%' }}>{children}</main>
                      <Footer />
                    </Box>
                  </MarketsBasicProvider>
                </ModalStatusProvider>
              </MarketProvider>
            </AccountDataProvider>
            <Web3Modal />
          </NetworkContextProvider>
        </WagmiConfig>
      </ThemeProvider>
    </StaticContextProvider>
  );
}
