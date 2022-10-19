import { useContext, useEffect, useState } from 'react';
import Skeleton from 'react-loading-skeleton';
import dynamic from 'next/dynamic';
import { formatFixed, parseFixed } from '@ethersproject/bignumber';
import { MaxUint256 } from '@ethersproject/constants';
const Button = dynamic(() => import('components/common/Button'));

import LangContext from 'contexts/LangContext';
import { useWeb3Context } from 'contexts/Web3Context';
import ModalStatusContext, { Operation } from 'contexts/ModalStatusContext';
import AccountDataContext from 'contexts/AccountDataContext';
import { MarketContext } from 'contexts/MarketContext';

import { LangKeys } from 'types/Lang';
import { Maturity } from 'types/Maturity';
import { FixedMarketData } from 'types/FixedMarketData';

import styles from './style.module.scss';

import keys from './translations.json';
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
  const { setOpen, setOperation } = useContext(ModalStatusContext);
  const { setDate, setMarket } = useContext(MarketContext);
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
      const { market: marketAddress } = accountData[symbol];
      const fixedMarket = fixedMarketData?.find(({ market }) => market === marketAddress);

      const poolBorrowData = fixedMarket?.borrows.find(
        (pool) => pool.maturity.toString() === maturity?.value
      );
      const poolDepositData = fixedMarket?.deposits.find(
        (pool) => pool.maturity.toString() === maturity?.value
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

      //APRs
      const borrowFixedAPR = (Number(formatFixed(borrowRate, 18)) - 1) * borrowTime * 100;
      const depositFixedAPR = (Number(formatFixed(depositRate, 18)) - 1) * depositTime * 100;

      const rates = {
        depositAPR: 'N/A',
        borrowAPR: 'N/A'
      };

      if (depositFixedAPR >= 0.01) {
        rates.depositAPR = `${depositFixedAPR.toFixed(2)}%`;
      }

      // when borrowing is not possible, the previewer returns MaxUint256
      if (borrowFixedAPR >= 0.01 && !finalBorrowAssets.eq(MaxUint256)) {
        rates.borrowAPR = `${borrowFixedAPR.toFixed(2)}%`;
      }

      setRates(rates);
    } catch (e) {
      console.log(e);
    }
  }

  function handleClick(type: string, maturity: Maturity) {
    if (!walletAddress && connect) return connect();

    if (!accountData) return;

    const marketData = accountData[symbol];

    setOperation(type as Operation);
    setMarket({ value: marketData.market });
    setDate(maturity);
    setOpen(true);
  }

  return (
    <div className={styles.row}>
      <div className={styles.maturity}>
        <span className={styles.value}>{maturity?.label || <Skeleton />}</span>
      </div>
      <div className={styles.lastFixedRate}>
        <div className={styles.deposit}>{rates?.depositAPR || <Skeleton />}</div>
        <div className={styles.borrow}>{rates?.borrowAPR || <Skeleton />}</div>
      </div>
      <div className={styles.actions}>
        <div className={styles.buttonContainer}>
          {maturity ? (
            <Button
              text={translations[lang].deposit}
              className="primary"
              onClick={() => handleClick('depositAtMaturity', maturity)}
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
              onClick={() => handleClick('borrowAtMaturity', maturity)}
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
