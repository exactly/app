'use client';

import React from 'react';
import { useSearchParams } from 'next/navigation';
import AssetMaturityPools from 'components/asset/MaturityPool';
import AssetFloatingPool from 'components/asset/FloatingPool';
import AssetHeaderInfo from 'components/asset/Header';
import { useTranslation } from 'react-i18next';

import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { Box, IconButton, Tooltip, Typography, Grid } from '@mui/material';
import Link from 'next/link';
import { usePageView } from 'hooks/useAnalytics';
import useAssets from 'hooks/useAssets';
import ErrorPageMessage from 'components/ErrorPageMessage';

const Market = ({ params: { symbol } }: { params: { symbol: string } }) => {
  usePageView();

  const { t } = useTranslation();
  const query = useSearchParams().toString();
  const assets = useAssets();

  if (assets.length === 0) return null;

  if (!assets.includes(symbol)) {
    return (
      <ErrorPageMessage
        code={404}
        description={t('Page Not Found')}
        message={t('The page you are looking for is not available.')}
      />
    );
  }

  return (
    <Grid container mt={-1}>
      <Box sx={{ display: 'flex', gap: 0.5 }} mb={1}>
        <Link href={{ pathname: '/', query }} legacyBehavior>
          <IconButton size="small">
            <Tooltip title={t('Go Back')} placement="top">
              <ArrowBackIcon fontSize="small" />
            </Tooltip>
          </IconButton>
        </Link>
        <Typography color="grey.500" sx={{ fontSize: '13px', fontWeight: 600, my: 'auto' }}>
          {t('Back')}
        </Typography>
      </Box>
      <AssetHeaderInfo symbol={symbol} />
      <Box display="flex" flexDirection={{ xs: 'column', sm: 'row' }} my="16px" gap="16px">
        <Box maxWidth={{ xs: '100%', sm: '50%' }}>
          <AssetFloatingPool symbol={symbol} />
        </Box>
        <Box maxWidth={{ xs: '100%', sm: '50%' }}>
          <AssetMaturityPools symbol={symbol} />
        </Box>
      </Box>
    </Grid>
  );
};

export default Market;
