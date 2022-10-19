import { useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { GetStaticProps, NextPage } from 'next';
import Grid from '@mui/material/Grid';

import Navbar from 'components/Navbar';
import PoolsChart from 'components/PoolsChart';
import AssetTable from 'components/asset/MaturityPool/AssetTable';
import FloatingPoolInfo from 'components/asset/FloatingPool/FloatingPoolInfo';
import MobileNavbar from 'components/MobileNavbar';
import Paginator from 'components/Paginator';
import Footer from 'components/Footer';
import OperationsModals from 'components/OperationsModal';

import { LangKeys } from 'types/Lang';
import { Maturity } from 'types/Maturity';

import LangContext from 'contexts/LangContext';
import { useWeb3Context } from 'contexts/Web3Context';
import { MarketContext } from 'contexts/MarketContext';
import FixedLenderContext from 'contexts/FixedLenderContext';
import AccountDataContext from 'contexts/AccountDataContext';

import style from './style.module.scss';

import keys from './translations.json';

import getLastAPR from 'utils/getLastAPR';
import FloatingAPRChart from 'components/asset/FloatingPool/FloatingAPRChart';
import { getSymbol, getUnderlyingData } from 'utils/utils';
import AssetHeaderInfo from 'components/asset/Header';
import { AssetSymbol } from 'utils/assets';
// import AssetMaturityPools from 'components/asset/MaturityPool';
import MaturityPoolInfo from 'components/asset/MaturityPool/MaturityPoolInfo';

interface Props {
  symbol: string;
}

const Asset: NextPage<Props> = ({ symbol = 'DAI' }) => {
  const { network } = useWeb3Context();
  const { dates, market } = useContext(MarketContext);
  const fixedLenderData = useContext(FixedLenderContext);
  const { accountData } = useContext(AccountDataContext);
  const lang: string = useContext(LangContext);
  const translations: { [key: string]: LangKeys } = keys;

  const networkName = (network?.name || process.env.NEXT_PUBLIC_NETWORK) as string;
  const assetAddress = getUnderlyingData(networkName, symbol.toLowerCase())?.address as string;

  const itemsPerPage = 3;
  const [page, setPage] = useState<number>(1);
  const [depositsData, setDepositsData] = useState<Array<Maturity> | undefined>(undefined);
  const [borrowsData, setBorrowsData] = useState<Array<Maturity> | undefined>(undefined);

  const eMarketAddress = useMemo(() => {
    const filteredFixedLender = fixedLenderData.find((contract: any) => {
      const contractSymbol = getSymbol(
        contract.address!,
        network?.name ?? process.env.NEXT_PUBLIC_NETWORK
      );
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
          <Grid item container>
            <FloatingPoolInfo
              symbol={symbol}
              eMarketAddress={eMarketAddress}
              networkName={networkName}
            />
            <FloatingAPRChart networkName={networkName} market={eMarketAddress} />
          </Grid>
          <Grid item container mt={5}>
            <MaturityPoolInfo
              symbol={symbol}
              eMarketAddress={eMarketAddress}
              networkName={networkName}
            />
          </Grid>
        </Grid>
        <section className={style.graphContainer}>
          <div className={style.leftColumn}>
            <AssetTable
              page={page}
              itemsPerPage={itemsPerPage}
              symbol={symbol}
              deposits={depositsData}
              borrows={borrowsData}
            />
            <Paginator
              itemsPerPage={itemsPerPage}
              handleChange={(page) => setPage(page)}
              currentPage={page}
            />
          </div>
          <div className={style.assetGraph}>
            <PoolsChart deposits={depositsData} borrows={borrowsData} />
          </div>
        </section>
        {/* <h2 className={style.assetTitle}>{translations[lang].assetDetails}</h2>
        <div className={style.assetInfoContainer}>
          <AssetInfo
            title={translations[lang].price}
            value={`$${parseFloat(ethers.utils.formatEther(marketData.oraclePrice))}`}
          />

          <AssetInfo
            title={translations[lang].collateralFactor}
            value={parseFloat(ethers.utils.formatEther(marketData.adjustFactor)) * 100}
            symbol="%"
          />
        </div>
        <div className={style.maturitiesContainer}></div> */}
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
      symbol: symbol
    }
  };
};

export async function getStaticPaths() {
  return {
    paths: ['/assets/dai', '/assets/eth', '/assets/usdc', '/assets/wbtc'],
    fallback: true
  };
}
