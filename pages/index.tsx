import React from 'react';
import type { NextPage } from 'next';
import { Box, Grid } from '@mui/material';

import MarketsHeader from 'components/markets/Header';
import MarketTables from 'components/markets/MarketsTables';
import MarketsBasic from 'components/markets/MarketsBasic';
import BackgroundCircle from 'components/BackgroundCircle';

import { usePageView } from 'hooks/useAnalytics';
import { useCustomTheme } from 'contexts/ThemeContext';

const Markets: NextPage = () => {
  usePageView('/', 'Markets');
  const { view } = useCustomTheme();

  if (!view) return null;

  return (
    <Grid>
      {view === 'advanced' ? (
        <>
          <MarketsHeader />
          <MarketTables />
        </>
      ) : (
        <Box display="flex" justifyContent="center" mb={2} mt={{ xs: 1, sm: 3 }}>
          <MarketsBasic />
          <BackgroundCircle />
        </Box>
      )}
    </Grid>
  );
};

export default Markets;
