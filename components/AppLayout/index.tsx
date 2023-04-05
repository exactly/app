'use client';

import 'i18n';

import React, { type PropsWithChildren } from 'react';
import { Box } from '@mui/material';
import { WagmiConfig, type Chain } from 'wagmi';

import { ModalStatusProvider } from 'contexts/ModalStatusContext';
import { MarketProvider } from 'contexts/MarketContext';
import { AccountDataProvider } from 'contexts/AccountDataContext';
import { ThemeProvider } from 'contexts/ThemeContext';
import { globals } from 'styles/theme';
import { MarketsBasicProvider } from 'contexts/MarketsBasicContext';
import { NetworkContextProvider } from 'contexts/NetworkContext';
import Web3Modal from 'components/Web3Modal';
import Footer from 'components/Footer';
import Navbar from 'components/Navbar';
import { wagmi } from 'utils/client';
import { decodeMarkets } from 'utils/markets';
import { AccountData } from 'types/AccountData';
import useQueryChain from 'hooks/useQueryChain';

const { maxWidth } = globals;

type Props = {
  chainMarkets: string;
};

export type ChainMarkets = Record<number, string>;

export default function AppLayout({ chainMarkets: exactly, children }: PropsWithChildren<Props>) {
  const chain: Chain = useQueryChain();
  const chainMarkets = JSON.parse(exactly) as Record<number, string>;
  const decodedMarkets = decodeMarkets(chainMarkets[chain.id]);
  const markets: AccountData = Object.fromEntries(decodedMarkets.map((market) => [market.assetSymbol, market]));

  return (
    <ThemeProvider>
      <WagmiConfig client={wagmi}>
        <NetworkContextProvider initial={chain}>
          <AccountDataProvider initial={markets}>
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
  );
}
