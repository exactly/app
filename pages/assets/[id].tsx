import { useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { GetStaticProps, NextPage } from 'next';
import Grid from '@mui/material/Grid';

import Navbar from 'components/Navbar';
import MobileNavbar from 'components/MobileNavbar';
import Footer from 'components/Footer';
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
import { AssetSymbol } from 'utils/assets';
import AssetMaturityPools from 'components/asset/MaturityPool';
import AssetFloatingPool from 'components/asset/FloatingPool';

interface Props {
  symbol: string;
}

const Asset: NextPage<Props> = ({ symbol = 'DAI' }) => {
  const { network } = useWeb3Context();
  const { dates } = useContext(MarketContext);
  const fixedLenderData = useContext(FixedLenderContext);
  const { accountData } = useContext(AccountDataContext);

  const networkName = (network?.name || process.env.NEXT_PUBLIC_NETWORK) as string;
  const assetAddress = getUnderlyingData(networkName, symbol.toLowerCase())?.address as string;

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

      <section className={style.container}>
        <AssetHeaderInfo
          symbol={symbol.toLowerCase() as AssetSymbol}
          assetAddress={assetAddress}
          networkName={networkName}
        />
        <Grid container spacing={4} mt={5} ml={0}>
          <Grid item container spacing={4}>
            <AssetFloatingPool symbol={symbol} eMarketAddress={eMarketAddress} networkName={networkName} />
          </Grid>
          <Grid item container mt={5}>
            <AssetMaturityPools symbol={symbol} />
          </Grid>
        </Grid>
      </section>
      <Footer />
    </>
  );
};

export default Asset;

export const getStaticProps: GetStaticProps = async (context) => {
  const tokenSymbol: string = context.params?.id as string;
  const symbol = tokenSymbol.toUpperCase() === 'ETH' ? 'WETH' : tokenSymbol.toUpperCase();

  return {
    props: {
      symbol: symbol,
    },
  };
};

export async function getStaticPaths() {
  return {
    paths: ['/assets/dai', '/assets/eth', '/assets/usdc', '/assets/wbtc'],
    fallback: true,
  };
}
