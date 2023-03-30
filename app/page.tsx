'use client';

import React, { useContext } from 'react';
import type { NextPage } from 'next';
import { Box } from '@mui/material';

import MarketsHeader from 'components/markets/Header';
import MarketTables from 'components/markets/MarketsTables';
import MarketsBasic from 'components/markets/MarketsBasic';
import BackgroundCircle from 'components/BackgroundCircle';

import { MarketContext } from 'contexts/MarketContext';
import { usePage } from 'hooks/useAnalytics';

const Markets: NextPage = () => {
  usePage();

  const { view } = useContext(MarketContext);

  if (!view) return null;

  return view === 'advanced' ? (
    <>
      <MarketsHeader />
      <MarketTables />
    </>
  ) : (
    <Box display="flex" justifyContent="center" mb={2} mt={{ xs: 1, sm: 3 }}>
      <MarketsBasic />
      <BackgroundCircle />
    </Box>
  );
};

export default Markets;
