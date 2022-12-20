import React, { useEffect } from 'react';
import PropTypes from 'prop-types';
import { basename } from 'path';
import { readdir, readFile } from 'fs/promises';
import type { GetStaticPaths, GetStaticProps, NextPage } from 'next';
import AssetMaturityPools from 'components/asset/MaturityPool';
import AssetFloatingPool from 'components/asset/FloatingPool';
import AssetHeaderInfo from 'components/asset/Header';

import { useRouter } from 'next/router';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { Box, IconButton, Tooltip, Typography, Grid } from '@mui/material';
import analytics from 'utils/analytics';
import useAccountData from 'hooks/useAccountData';

const Market: NextPage<{ symbol: string }> = ({ symbol }) => {
  const router = useRouter();
  const { market } = useAccountData(symbol);

  useEffect(() => void analytics.page(), []);

  return (
    <>
      <Grid container mt={-1}>
        <Box sx={{ display: 'flex', gap: 0.5 }} mb={1}>
          <IconButton size="small" onClick={() => router.back()}>
            <Tooltip title="Go Back" placement="top">
              <ArrowBackIcon fontSize="small" />
            </Tooltip>
          </IconButton>
          <Typography color="grey.500" sx={{ fontSize: '14px', fontWeight: 600, my: 'auto' }}>
            Back
          </Typography>
        </Box>
        <AssetHeaderInfo symbol={symbol} />
        <Grid container mt={3}>
          <Grid item container>
            <AssetFloatingPool symbol={symbol} eMarketAddress={market} />
          </Grid>
          <Grid item container>
            <AssetMaturityPools symbol={symbol} />
          </Grid>
        </Grid>
      </Grid>
    </>
  );
};

Market.propTypes = {
  symbol: PropTypes.string.isRequired,
};

export default Market;

export const getStaticPaths: GetStaticPaths<{ symbol: string }> = async () => {
  const deploymentsDir = 'node_modules/@exactly-protocol/protocol/deployments';
  const networks = await readdir(deploymentsDir);
  const markets = await Promise.all(
    networks.map(async (network) => {
      try {
        await readFile(`${deploymentsDir}/${network}/.chainId`);
        return (await readdir(`${deploymentsDir}/${network}`))
          .map((filename) => basename(filename, '.json'))
          .filter((name) => name.startsWith('Market') && !name.includes('_') && !name.includes('Router'))
          .map((name) => name.replace(/^Market/, ''));
      } catch {
        return [];
      }
    }),
  );
  return {
    paths: Array.from(new Set(markets.flat())).map((symbol) => ({ params: { symbol } })),
    fallback: false,
  };
};

export const getStaticProps: GetStaticProps<{ symbol: string }, { symbol: string }> = ({ params }) => {
  if (!params) throw new Error('missing params');
  return { props: { symbol: params.symbol } };
};
