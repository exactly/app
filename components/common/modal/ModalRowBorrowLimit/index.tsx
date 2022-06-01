import { useContext, useEffect, useState } from 'react';
import Image from 'next/image';
import Skeleton from 'react-loading-skeleton';

import { LangKeys } from 'types/Lang';
import { HealthFactor } from 'types/HealthFactor';

import parseSymbol from 'utils/parseSymbol';
import getExchangeRate from 'utils/getExchangeRate';

import LangContext from 'contexts/LangContext';

import styles from './style.module.scss';

import keys from './translations.json';
import formatNumber from 'utils/formatNumber';

type Props = {
  qty: string;
  symbol: string;
  healthFactor: HealthFactor | undefined;
  collateralFactor: number | undefined;
  operation: string;
};

function ModalRowBorrowLimit({
  qty,
  symbol,
  healthFactor,
  collateralFactor = 0.8,
  operation
}: Props) {
  const lang: string = useContext(LangContext);
  const translations: { [key: string]: LangKeys } = keys;

  const parsedSymbol = parseSymbol(symbol);

  const [newQty, setNewQty] = useState<number | undefined>(undefined);

  const beforeBorrowLimit = healthFactor ? healthFactor!.collateral - healthFactor!.debt : 0;

  let afterBorrowLimit = 0;

  async function getAmount() {
    const exchangeRate = await getExchangeRate(parsedSymbol);

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

  return (
    <section className={`${styles.row} ${styles.line}`}>
      <p className={styles.text}>{translations[lang].borrowLimit}</p>
      <section className={styles.values}>
        <span className={styles.value}>
          {(healthFactor && formatNumber(beforeBorrowLimit, parsedSymbol)) || <Skeleton />}
        </span>
        <div className={styles.imageContainer}>
          <Image src="/img/icons/arrowRight.svg" alt="arrowRight" layout="fill" />
        </div>
        <span className={styles.value}>
          {(healthFactor &&
            formatNumber(afterBorrowLimit > 0 ? afterBorrowLimit : 0, parsedSymbol)) || (
            <Skeleton />
          )}
        </span>
      </section>
    </section>
  );
}

export default ModalRowBorrowLimit;
