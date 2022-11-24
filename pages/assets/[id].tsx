import PropTypes from 'prop-types';
import React, { useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { GetStaticProps, NextPage } from 'next';
import Grid from '@mui/material/Grid';

import Navbar from 'components/Navbar';
import MobileNavbar from 'components/MobileNavbar';
import OperationsModals from 'components/OperationsModal';

import { Maturity } from 'types/Maturity';

import { useWeb3Context } from 'contexts/Web3Context';
import { MarketContext } from 'contexts/MarketContext';
import FixedLenderContext from 'contexts/FixedLenderContext';
import AccountDataContext from 'contexts/AccountDataContext';

import style from './style.module.scss';

import getLastAPR from 'utils/getLastAPR';
import { getSymbol, getUnderlyingData } from 'utils/utils';
import AssetHeaderInfo from 'components/asset/Header';
import AssetMaturityPools from 'components/asset/MaturityPool';
import AssetFloatingPool from 'components/asset/FloatingPool';
import analytics from 'utils/analytics';

void analytics.page();

const Asset: NextPage<{ symbol: string }> = ({ symbol }) => {
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

  return (
    <>
      <OperationsModals />
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

Asset.propTypes = {
  symbol: PropTypes.string.isRequired,
};

export default Asset;

export const getStaticProps: GetStaticProps = async (context) => {
  const tokenSymbol: string = context.params?.id as string;
  const symbol = tokenSymbol === 'ETH' ? 'WETH' : tokenSymbol;

  return {
    props: {
      symbol: symbol,
    },
  };
};

export async function getStaticPaths() {
  return {
    paths: ['/assets/DAI', '/assets/WETH', '/assets/USDC', '/assets/WBTC', '/assets/wstETH'],
    fallback: true,
  };
}
