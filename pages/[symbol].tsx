import React, { useCallback, useContext, useEffect, useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import { Grid } from '@mui/material';
import { basename } from 'path';
import { readdir, readFile } from 'fs/promises';
import type { GetStaticPaths, GetStaticProps, NextPage } from 'next';
import type { Maturity } from 'types/Maturity';
import { getUnderlyingData } from 'utils/utils';
import { MarketContext } from 'contexts/MarketContext';
import { useWeb3 } from 'hooks/useWeb3';
import AccountDataContext from 'contexts/AccountDataContext';
import AssetMaturityPools from 'components/asset/MaturityPool';
import AssetFloatingPool from 'components/asset/FloatingPool';
import OperationsModal from 'components/OperationsModal';
import AssetHeaderInfo from 'components/asset/Header';
import MobileNavbar from 'components/MobileNavbar';
import Navbar from 'components/Navbar';
import getLastAPR from 'utils/getLastAPR';
import analytics from 'utils/analytics';
import style from './[symbol].module.scss';

const Market: NextPage<{ symbol: string }> = ({ symbol }) => {
  const { chain } = useWeb3();
  const { dates } = useContext(MarketContext);
  const { accountData } = useContext(AccountDataContext);

  const networkName = (chain?.network || process.env.NEXT_PUBLIC_NETWORK) as string;
  const assetAddress = getUnderlyingData(networkName, symbol)?.address as string;

  const [, setDepositsData] = useState<Array<Maturity> | undefined>(undefined);
  const [, setBorrowsData] = useState<Array<Maturity> | undefined>(undefined);

  const market = useMemo(() => accountData?.[symbol].market, [accountData, symbol]);

  const handleAPR = useCallback(async () => {
    if (!accountData || !market || !chain) return;

    try {
      const apr: any = await getLastAPR(dates, symbol, chain.id, accountData);

      const deposit = apr?.sortedDeposit;
      const borrow = apr?.sortedBorrow;

      setDepositsData(deposit);
      setBorrowsData(borrow);
    } catch (e) {
      console.log(e);
    }
  }, [chain, accountData, market, dates]);

  useEffect(() => void handleAPR(), [handleAPR]);

  useEffect(() => void analytics.page(), []);

  return (
    <>
      <OperationsModal />
      <MobileNavbar />
      <Navbar />

      <section className={style.container} style={{ marginTop: '130px' }}>
        <AssetHeaderInfo symbol={symbol} assetAddress={assetAddress} eMarketAddress={market} />
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
