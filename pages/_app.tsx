import '../styles/globals.css';
import '../styles/variables.css';

import 'i18n';

import React from 'react';
import Head from 'next/head';
import { WagmiConfig } from 'wagmi';
import type { AppProps } from 'next/app';
import { Box } from '@mui/material';

import { AccountDataProvider } from 'contexts/AccountDataContext';
import { ThemeProvider } from 'contexts/ThemeContext';
import { wagmi, isE2E } from 'utils/client';
import Footer from 'components/Footer';
import Navbar from 'components/Navbar';
import { globals } from 'styles/theme';
import { GlobalErrorProvider } from 'contexts/GlobalErrorContext';
import { usePageTracking } from 'hooks/usePageTracking';
import dayjs from 'dayjs';
import isToday from 'dayjs/plugin/isToday';

import { ModalContextProvider } from 'contexts/ModalContext';
import OperationsModal from 'components/OperationsModal';
import LeveragerModal from 'components/Leverager/Modal';
import RewardsModal from 'components/RewardsModal';
import DebtManagerModal from 'components/DebtManager';
import FaucetModal from 'components/operations/Faucet/Modal';
import NewsModal from 'components/NewsModal';
import GetEXAModal from 'components/GetEXA/ModalWrapper';
import MaturityDateReminder from '../components/MaturityDateReminder';
import NewIRMBanner from '../components/NewIRMBanner';
import EXACard from 'components/ExaCard';
import { StakeEXAProvider } from 'contexts/StakeEXAContext';

dayjs.extend(isToday);
const { maxWidth } = globals;

const Modals = () => (
  <>
    <OperationsModal />
    <RewardsModal />
    <DebtManagerModal />
    <LeveragerModal />
    <FaucetModal />
    <GetEXAModal />
    {!isE2E && <NewsModal />}
  </>
);

export default function App({ Component, pageProps, router }: AppProps) {
  usePageTracking();

  return (
    <>
      <Head>
        <title>Exactly Protocol - Decentralizing the credit market, today</title>
        <meta
          name="description"
          content="Exactly Protocol is a decentralized, non-custodial and open-source protocol that provides an autonomous fixed and variable interest rate market enabling users to exchange the time value of their assets and completing the DeFi credit market."
        />
        <link rel="icon" href="/icon.ico" />

        <meta property="og:url" content="https://app.exact.ly" />
        <meta property="og:type" content="website" />
        <meta property="og:title" content="Exactly Protocol - Decentralizing the credit market, today" />
        <meta
          property="og:description"
          content="Exactly Protocol is a decentralized, non-custodial and open-source protocol that provides an autonomous fixed and variable interest rate market enabling users to exchange the time value of their assets and completing the DeFi credit market."
        />
        <meta property="og:image" content="https://app.exact.ly/img/social/ogp.png" />
        <meta property="og:image:secure_url" content="https://app.exact.ly/img/social/ogp.png" />
        <meta property="og:image:type" content="image/png" />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />

        <meta name="twitter:card" content="summary_large_image" />
        <meta property="twitter:domain" content="exact.ly" />
        <meta property="twitter:url" content="https://exact.ly" />
        <meta name="twitter:title" content="Exactly Protocol - Decentralizing the credit market, today" />
        <meta
          name="twitter:description"
          content="Exactly Protocol is a decentralized, non-custodial and open-source protocol that provides an autonomous fixed and variable interest rate market enabling users to exchange the time value of their assets and completing the DeFi credit market."
        />
        <meta name="twitter:image" content="https://app.exact.ly/img/social/ogp.png" />
      </Head>
      <WagmiConfig config={wagmi}>
        <ThemeProvider>
          <ModalContextProvider>
            <GlobalErrorProvider>
              <AccountDataProvider>
                <StakeEXAProvider>
                  <NewIRMBanner />
                  <Box display="flex" flexDirection="column" px={2} height="100%">
                    <Navbar />
                    {router.pathname === '/strategies' && (
                      <Box position="relative" zIndex={-1} mx={-2}>
                        <Box
                          position="absolute"
                          left={0}
                          bgcolor={({ palette }) => (palette.mode === 'dark' ? 'grey.100' : 'figma.grey.100')}
                          width="100vw"
                          height={{ xs: 1400, sm: 440 }}
                        />
                      </Box>
                    )}
                    <main style={{ flexGrow: 1, maxWidth, margin: '0 auto', width: '100%' }}>
                      <Component {...pageProps} />
                    </main>
                    <Footer />
                  </Box>
                  <Modals />
                  <MaturityDateReminder />
                  <EXACard />
                </StakeEXAProvider>
              </AccountDataProvider>
            </GlobalErrorProvider>
          </ModalContextProvider>
        </ThemeProvider>
      </WagmiConfig>
    </>
  );
}
