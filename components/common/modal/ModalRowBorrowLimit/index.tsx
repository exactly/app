import { useContext, useEffect, useState } from 'react';
import Image from 'next/image';
import Skeleton from 'react-loading-skeleton';
import { ethers } from 'ethers';

import { LangKeys } from 'types/Lang';
import { HealthFactor } from 'types/HealthFactor';

import LangContext from 'contexts/LangContext';
import AccountDataContext from 'contexts/AccountDataContext';

import styles from './style.module.scss';

import keys from './translations.json';
import formatNumber from 'utils/formatNumber';

type Props = {
  qty: string;
  symbol: string;
  healthFactor: HealthFactor | undefined;
  collateralFactor: number | undefined;
  operation: string;
  line?: boolean;
};

function ModalRowBorrowLimit({
  qty,
  symbol,
  healthFactor,
  collateralFactor = 0.8,
  operation,
  line
}: Props) {
  const { accountData } = useContext(AccountDataContext);

  const lang: string = useContext(LangContext);
  const translations: { [key: string]: LangKeys } = keys;

  const [newQty, setNewQty] = useState<number | undefined>(undefined);

  const beforeBorrowLimit = healthFactor ? healthFactor!.collateral - healthFactor!.debt : 0;

  let afterBorrowLimit = 0;

  async function getAmount() {
    if (!accountData || !symbol) return;

    const exchangeRate = parseFloat(ethers.utils.formatEther(accountData[symbol].oraclePrice));

    const newQty = exchangeRate * parseFloat(qty);

    setNewQty(newQty);
  }

  useEffect(() => {
    getAmount();
  }, [symbol, qty]);

  switch (operation) {
    case 'deposit':
      afterBorrowLimit = beforeBorrowLimit + (newQty || 0) * collateralFactor;
      break;
    case 'withdraw':
      afterBorrowLimit = beforeBorrowLimit - (newQty || 0);
      break;
    case 'borrow':
      afterBorrowLimit = beforeBorrowLimit - (newQty || 0);
      break;
    case 'repay':
      afterBorrowLimit = beforeBorrowLimit + (newQty || 0) * collateralFactor;
      break;
  }

  const rowStyles = line ? `${styles.row} ${styles.line}` : styles.row;

  return (
    <section className={rowStyles}>
      <p className={styles.text}>{translations[lang].borrowLimit}</p>
      <section className={styles.values}>
        <span className={styles.value}>
          {(healthFactor && formatNumber(beforeBorrowLimit, 'usd')) || <Skeleton />}
        </span>
        <div className={styles.imageContainer}>
          <Image src="/img/icons/arrowRight.svg" alt="arrowRight" layout="fill" />
        </div>
        <span className={styles.value}>
          {(healthFactor && formatNumber(afterBorrowLimit > 0 ? afterBorrowLimit : 0, 'usd')) || (
            <Skeleton />
          )}
        </span>
      </section>
    </section>
  );
}

export default ModalRowBorrowLimit;
