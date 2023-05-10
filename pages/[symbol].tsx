import React, { useEffect } from 'react';
import { basename } from 'path';
import { readdir, readFile } from 'fs/promises';
import type { GetStaticPaths, GetStaticProps, NextPage } from 'next';
import AssetMaturityPools from 'components/asset/MaturityPool';
import AssetFloatingPool from 'components/asset/FloatingPool';
import AssetHeaderInfo from 'components/asset/Header';

import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { Box, IconButton, Tooltip, Typography, Grid } from '@mui/material';
import Link from 'next/link';
import useAnalytics from 'hooks/useAnalytics';
import useRouter from 'hooks/useRouter';
import { useTranslation } from 'react-i18next';

type Props = {
  symbol: string;
};

const Market: NextPage<Props> = ({ symbol }: Props) => {
  const { t } = useTranslation();
  const { query } = useRouter();
  const { page } = useAnalytics();
  useEffect(() => void page(), [page]);

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

export const getStaticPaths: GetStaticPaths<Props> = async () => {
  const deploymentsDir = 'node_modules/@exactly/protocol/deployments';
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

export const getStaticProps: GetStaticProps<Props, Props> = ({ params }) => {
  if (!params) throw new Error('missing params');
  return { props: { symbol: params.symbol } };
};
