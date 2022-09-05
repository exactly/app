import { useContext, useEffect, useState } from 'react';
import type { GetStaticProps, NextPage } from 'next';

import Navbar from 'components/Navbar';
import CurrentNetwork from 'components/CurrentNetwork';
import PoolsChart from 'components/PoolsChart';
import AssetTable from 'components/AssetTable';
import SmartPoolInfo from 'components/SmartPoolInfo';
import MobileNavbar from 'components/MobileNavbar';
import Paginator from 'components/Paginator';
import Footer from 'components/Footer';
import ModalsContainer from 'components/ModalsContainer';

import { LangKeys } from 'types/Lang';
import { Maturity } from 'types/Maturity';

import LangContext from 'contexts/LangContext';
import { useWeb3Context } from 'contexts/Web3Context';
import { AddressContext } from 'contexts/AddressContext';
import FixedLenderContext from 'contexts/FixedLenderContext';
import AccountDataContext from 'contexts/AccountDataContext';

import style from './style.module.scss';

import keys from './translations.json';

import getLastAPY from 'utils/getLastAPY';
import { getSymbol } from 'utils/utils';

interface Props {
  symbol: string;
}

const Asset: NextPage<Props> = ({ symbol = 'DAI' }) => {
  const { network } = useWeb3Context();
  const { dates } = useContext(AddressContext);
  const fixedLenderData = useContext(FixedLenderContext);
  const { accountData } = useContext(AccountDataContext);

  const lang: string = useContext(LangContext);
  const translations: { [key: string]: LangKeys } = keys;

  const itemsPerPage = 3;
  const [page, setPage] = useState<number>(1);
  const [depositsData, setDepositsData] = useState<Array<Maturity> | undefined>(undefined);
  const [borrowsData, setBorrowsData] = useState<Array<Maturity> | undefined>(undefined);

  useEffect(() => {
    handleAPY();
  }, [network, accountData, symbol]);

  async function handleAPY() {
    if (!accountData) return;

    const filteredFixedLender = fixedLenderData.find((contract: any) => {
      const contractSymbol = getSymbol(
        contract.address!,
        network?.name ?? process.env.NEXT_PUBLIC_NETWORK
      );
      return contractSymbol == symbol;
    });

    try {
      const apy: any = await getLastAPY(dates, filteredFixedLender?.address!, network, accountData);

      const deposit = apy?.sortedDeposit;
      const borrow = apy?.sortedBorrow;

      setDepositsData(deposit);
      setBorrowsData(borrow);
    } catch (e) {
      console.log(e);
    }
  }

  return (
    <>
      <MobileNavbar />
      <Navbar />
      <CurrentNetwork />

      <ModalsContainer />

      <section className={style.container}>
        <div className={style.smartPoolContainer}>
          <SmartPoolInfo symbol={symbol} />
        </div>
        <section className={style.assetData}>
          <div className={style.assetContainer}>
            <p className={style.title}>{translations[lang].maturityPools}</p>
          </div>
          <div className={style.assetMetricsContainer}></div>
        </section>
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
