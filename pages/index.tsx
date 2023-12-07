import React from 'react';
import type { NextPage } from 'next';
import { Box, Grid, useTheme } from '@mui/material';

import MarketsHeader from 'components/markets/Header';
import MarketTables from 'components/markets/MarketsTables';
import MarketsBasic from 'components/markets/MarketsBasic';
import BackgroundCircle from 'components/BackgroundCircle';

import { useCustomTheme } from 'contexts/ThemeContext';

const Markets: NextPage = () => {
  const { view } = useCustomTheme();
  const { palette } = useTheme();

  if (!view) return null;

  return (
    <Grid>
      <Box
        sx={{
          position: 'absolute',
          height: '30%',
          width: '100%',
          left: 0,
          top: 0,
          backgroundColor: palette.mode === 'light' ? 'grey.300' : '#181A1B',
          zIndex: -1,
        }}
      />
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
