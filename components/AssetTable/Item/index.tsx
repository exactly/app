import { useContext, useEffect, useState } from 'react';
import Skeleton from 'react-loading-skeleton';
import dynamic from 'next/dynamic';
import { formatFixed, parseFixed } from '@ethersproject/bignumber';

const Button = dynamic(() => import('components/common/Button'));

import LangContext from 'contexts/LangContext';
import { useWeb3Context } from 'contexts/Web3Context';
import ModalStatusContext from 'contexts/ModalStatusContext';
import AccountDataContext from 'contexts/AccountDataContext';
import { AddressContext } from 'contexts/AddressContext';

import { LangKeys } from 'types/Lang';
import { Maturity } from 'types/Maturity';
import { FixedMarketData } from 'types/FixedMarketData';
import { Pool } from 'types/Pool';

import styles from './style.module.scss';

import keys from './translations.json';
import { ethers } from 'ethers';
import { Dictionary } from 'types/Dictionary';

type Props = {
  symbol: string;
  maturity: Maturity | undefined;
  deposits: Array<Maturity> | undefined;
  borrows: Array<Maturity> | undefined;
  fixedMarketData: FixedMarketData[] | undefined;
};

function Item({ symbol, maturity, fixedMarketData }: Props) {
  const { walletAddress, connect, network } = useWeb3Context();
  const { setOpen } = useContext(ModalStatusContext);
  const { setDate } = useContext(AddressContext);
  const { accountData } = useContext(AccountDataContext);

  const lang: string = useContext(LangContext);
  const translations: { [key: string]: LangKeys } = keys;

  const [rates, setRates] = useState<Dictionary<string> | undefined>(undefined);

  useEffect(() => {
    getMarketData();
  }, [maturity, network, symbol, accountData, fixedMarketData]);

  async function getMarketData() {
    if (!accountData) return;

    setRates(undefined);

    try {
      const marketAddress = accountData[symbol].market;
      const fixedMarket = fixedMarketData?.find((element) => element.market == marketAddress);

      const poolBorrowData = fixedMarket?.borrows.find(
        (pool) => pool.maturity.toString() == maturity?.value
      );
      const poolDepositData = fixedMarket?.deposits.find(
        (pool) => pool.maturity.toString() == maturity?.value
      );

      if (!fixedMarket || !poolBorrowData || !poolDepositData) return;

      //market initial assets
      const initialAssets = fixedMarket.assets;

      //final operation assets
      const finalBorrowAssets = poolBorrowData.assets;
      const finalDepositAssets = poolDepositData.assets;

      //rate
      const borrowRate = finalBorrowAssets.mul(parseFixed('1', 18)).div(initialAssets);
      const depositRate = finalDepositAssets.mul(parseFixed('1', 18)).div(initialAssets);

      //currentTimestamp
      const borrowTimestamp = new Date().getTime() / 1_000;
      const depositTimestamp = new Date().getTime() / 1_000;

      //time
      const borrowTime = 31_536_000 / (parseInt(maturity?.value!) - borrowTimestamp);
      const depositTime = 31_536_000 / (parseInt(maturity?.value!) - depositTimestamp);

      //APYs
      const borrowFixedAPY = (Number(formatFixed(borrowRate, 18)) ** borrowTime - 1) * 100;
      const depositFixedAPY = (Number(formatFixed(depositRate, 18)) ** depositTime - 1) * 100;

      const rates = {
        depositAPY: 'N/A',
        borrowAPY: 'N/A'
      };

      if (depositFixedAPY >= 0.01) {
        rates.depositAPY = `${depositFixedAPY.toFixed(2)}%`;
      }

      if (borrowFixedAPY >= 0.01) {
        rates.borrowAPY = `${borrowFixedAPY.toFixed(2)}%`;
      }

      setRates(rates);
    } catch (e) {
      console.log(e);
    }
  }

  function handleClick(type: string, maturity: Maturity) {
    if (!walletAddress && connect) return connect();

    if (!accountData) return;

    setOpen(true);

    const marketData = accountData[symbol];

    const market = {
      market: marketData.market,
      symbol: marketData.assetSymbol,
      name: marketData.assetSymbol,
      isListed: true,
      collateralFactor: 0,
      type
    };

    setDate(maturity);
  }

  return (
    <div className={styles.row}>
      <div className={styles.maturity}>
        <span className={styles.value}>{maturity?.label || <Skeleton />}</span>
      </div>
      <div className={styles.lastFixedRate}>
        <div className={styles.deposit}>{rates?.depositAPY ? rates.depositAPY : <Skeleton />}</div>
        <div className={styles.borrow}>{rates?.borrowAPY ? rates.borrowAPY : <Skeleton />}</div>
      </div>
      <div className={styles.actions}>
        <div className={styles.buttonContainer}>
          {maturity ? (
            <Button
              text={translations[lang].deposit}
              className="primary"
              onClick={() => handleClick('deposit', maturity)}
            />
          ) : (
            <Skeleton className={styles.buttonContainer} />
          )}
        </div>
        <div className={styles.buttonContainer}>
          {maturity ? (
            <Button
              text={translations[lang].borrow}
              className="secondary"
              onClick={() => handleClick('borrow', maturity)}
            />
          ) : (
            <Skeleton className={styles.buttonContainer} />
          )}
        </div>
      </div>
    </div>
  );
}

export default Item;
