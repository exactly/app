import { useContext, useEffect, useState } from 'react';
import request from 'graphql-request';
import Skeleton from 'react-loading-skeleton';

import Button from 'components/common/Button';

import LangContext from 'contexts/LangContext';
import { useWeb3Context } from 'contexts/Web3Context';

import { LangKeys } from 'types/Lang';
import { Maturity } from 'types/Maturity';
import { Dictionary } from 'types/Dictionary';

import styles from './style.module.scss';

import keys from './translations.json';

import getSubgraph from 'utils/getSubgraph';

import { getLastMaturityPoolBorrowRate, getLastMaturityPoolDepositRate } from 'queries';

type Props = {
  maturity: Maturity | undefined;
  market: string | undefined;
  showModal: (type: string, maturity: string | undefined) => void | undefined;
};

function Item({ maturity, market, showModal }: Props) {
  const { walletAddress, connect, network } = useWeb3Context();

  const lang: string = useContext(LangContext);
  const translations: { [key: string]: LangKeys } = keys;

  const [lastFixedRate, setLastFixedRate] = useState<Dictionary<string> | undefined>(undefined);
  const [currentMaturity, setCurrentMaturity] = useState<Maturity | undefined>(undefined);

  useEffect(() => {
    getLastFixedRate();
  }, [maturity, market]);

  async function getLastFixedRate() {
    setLastFixedRate(undefined);
    setCurrentMaturity(undefined);

    if (!market || !maturity) return;

    try {
      const subgraphUrl = getSubgraph(network?.name);

      const getLastBorrowRate = await request(
        subgraphUrl,
        getLastMaturityPoolBorrowRate(market, maturity.value)
      );

      const borrowFee = getLastBorrowRate?.borrowAtMaturities[0]?.fee;
      const borrowAmount = getLastBorrowRate?.borrowAtMaturities[0]?.assets;

      const getLastDepositRate = await request(
        subgraphUrl,
        getLastMaturityPoolDepositRate(market, maturity.value)
      );

      const depositFee = getLastDepositRate?.depositAtMaturities[0]?.fee;
      const depositAmount = getLastDepositRate?.depositAtMaturities[0]?.assets;

      const borrowFixedRate = (parseFloat(borrowFee) * 100) / parseFloat(borrowAmount);
      const depositFixedRate = (parseFloat(depositFee) * 100) / parseFloat(depositAmount);

      setLastFixedRate({
        deposit: isNaN(depositFixedRate) ? '0.00' : depositFixedRate.toFixed(2),
        borrow: isNaN(borrowFixedRate) ? '0.00' : borrowFixedRate.toFixed(2)
      });
    } catch (e) {
      console.log(e);
    }

    setCurrentMaturity(maturity);
  }

  function handleClick(type: string, maturity: string) {
    if (!walletAddress && connect) return connect();
    showModal(type, maturity);
  }

  return (
    <div className={styles.row}>
      <div className={styles.maturity}>
        <span className={styles.value}>{currentMaturity?.label || <Skeleton />}</span>
        {/* <span className={styles.liquidity}>{translations[lang].liquidity}: $1.3B</span> */}
      </div>
      <div className={styles.lastFixedRate}>
        <div className={styles.deposit}>
          {lastFixedRate ? `${lastFixedRate?.deposit}%` : <Skeleton />}
        </div>
        <div className={styles.borrow}>
          {lastFixedRate ? `${lastFixedRate?.borrow}%` : <Skeleton />}
        </div>
      </div>
      <div className={styles.actions}>
        <div className={styles.buttonContainer}>
          {currentMaturity && maturity ? (
            <Button
              text={translations[lang].deposit}
              className="primary"
              onClick={() => handleClick('deposit', maturity.value)}
            />
          ) : (
            <Skeleton className={styles.buttonContainer} />
          )}
        </div>
        <div className={styles.buttonContainer}>
          {currentMaturity && maturity ? (
            <Button
              text={translations[lang].borrow}
              className="secondary"
              onClick={() => handleClick('borrow', maturity.value)}
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
