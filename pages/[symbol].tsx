import React, { useCallback, useContext, useEffect, useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import { Grid } from '@mui/material';
import { basename } from 'path';
import { readdir, readFile } from 'fs/promises';
import type { GetStaticPaths, GetStaticProps, NextPage } from 'next';
import type { Maturity } from 'types/Maturity';
import { getSymbol, getUnderlyingData } from 'utils/utils';
import { useWeb3Context } from 'contexts/Web3Context';
import { MarketContext } from 'contexts/MarketContext';
import AccountDataContext from 'contexts/AccountDataContext';
import FixedLenderContext from 'contexts/FixedLenderContext';
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
  const { network } = useWeb3Context();
  const { dates } = useContext(MarketContext);
  const fixedLenderData = useContext(FixedLenderContext);
  const { accountData } = useContext(AccountDataContext);

  const networkName = (network?.name || process.env.NEXT_PUBLIC_NETWORK) as string;
  const assetAddress = getUnderlyingData(networkName, symbol)?.address as string;

  const [, setDepositsData] = useState<Array<Maturity> | undefined>(undefined);
  const [, setBorrowsData] = useState<Array<Maturity> | undefined>(undefined);

  const eMarketAddress = useMemo(() => {
    const filteredFixedLender = fixedLenderData.find((contract: any) => {
      const contractSymbol = getSymbol(contract.address!, network?.name ?? process.env.NEXT_PUBLIC_NETWORK);
      return contractSymbol === symbol;
    });

    return filteredFixedLender?.address;
  }, [fixedLenderData, network?.name, symbol]);

  const handleAPR = useCallback(async () => {
    if (!accountData || !eMarketAddress) return;

    try {
      const apr: any = await getLastAPR(dates, eMarketAddress, network, accountData);

      const deposit = apr?.sortedDeposit;
      const borrow = apr?.sortedBorrow;

      setDepositsData(deposit);
      setBorrowsData(borrow);
    } catch (e) {
      console.log(e);
    }
  }, [network, accountData, eMarketAddress, dates]);

  useEffect(() => {
    handleAPR();
  }, [handleAPR]);

  useEffect(() => void analytics.page(), []);

  return (
    <>
      <OperationsModal />
      <MobileNavbar />
      <Navbar />

      <section className={style.container} style={{ marginTop: '130px' }}>
        <AssetHeaderInfo
          symbol={symbol}
          assetAddress={assetAddress}
          eMarketAddress={eMarketAddress}
          networkName={networkName}
        />
        <Grid container mt={5}>
          <Grid item container>
            <AssetFloatingPool symbol={symbol} eMarketAddress={eMarketAddress} networkName={networkName} />
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
