'use client';

import React from 'react';

import AssetMaturityPools from 'components/asset/MaturityPool';
import AssetFloatingPool from 'components/asset/FloatingPool';
import AssetHeaderInfo from 'components/asset/Header';

import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { Box, IconButton, Tooltip, Typography } from '@mui/material';
import Link from 'next/link';
import { usePage } from 'hooks/useAnalytics';
import { useSearchParams } from 'next/navigation';

type Props = {
  symbol: string;
};

export default function AssetPage({ symbol }: Props) {
  usePage();

  const query = useSearchParams().toString();

  return (
    <>
      <Box sx={{ display: 'flex', gap: 0.5 }} mb={1} mt={-1}>
        <Link href={{ pathname: '/', query }} legacyBehavior>
          <IconButton size="small">
            <Tooltip title="Go Back" placement="top">
              <ArrowBackIcon fontSize="small" />
            </Tooltip>
          </IconButton>
        </Link>
        <Typography color="grey.500" sx={{ fontSize: '13px', fontWeight: 600, my: 'auto' }}>
          Back
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
    </>
  );
}
