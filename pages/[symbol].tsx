import React, { useEffect } from 'react';
import PropTypes from 'prop-types';
import { Grid } from '@mui/material';
import { basename } from 'path';
import { readdir, readFile } from 'fs/promises';
import type { GetStaticPaths, GetStaticProps, NextPage } from 'next';
import AssetMaturityPools from 'components/asset/MaturityPool';
import AssetFloatingPool from 'components/asset/FloatingPool';
import OperationsModal from 'components/OperationsModal';
import AssetHeaderInfo from 'components/asset/Header';

import analytics from 'utils/analytics';
import style from './[symbol].module.scss';
import useAccountData from 'hooks/useAccountData';

const Market: NextPage<{ symbol: string }> = ({ symbol }) => {
  const { market } = useAccountData(symbol);

  useEffect(() => void analytics.page(), []);

  return (
    <>
      <OperationsModal />

      <section className={style.container}>
        <AssetHeaderInfo symbol={symbol} eMarketAddress={market} />
        <Grid container mt={5}>
          <Grid item container>
            <AssetFloatingPool symbol={symbol} eMarketAddress={market} />
          </Grid>
          <Grid item container>
            <AssetMaturityPools symbol={symbol} />
          </Grid>
        </Grid>
      </section>
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
