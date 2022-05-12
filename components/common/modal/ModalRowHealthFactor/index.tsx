import { useContext, useEffect, useState } from 'react';
import Image from 'next/image';

import { HealthFactor } from 'types/HealthFactor';
import { LangKeys } from 'types/Lang';

import parseHealthFactor from 'utils/parseHealthFactor';
import parseSymbol from 'utils/parseSymbol';
import getExchangeRate from 'utils/getExchangeRate';

import LangContext from 'contexts/LangContext';

import styles from './style.module.scss';

import keys from './translations.json';

type Props = {
  healthFactor: HealthFactor;
  qty: string;
  symbol: string;
  operation: string;
};

function ModalRowHealthFactor({ healthFactor, qty, symbol, operation }: Props) {
  const lang: string = useContext(LangContext);
  const translations: { [key: string]: LangKeys } = keys;
  const parsedSymbol = parseSymbol(symbol);

  const [newQty, setNewQty] = useState<number | undefined>(undefined);

  const beforeHealthFactor =
    healthFactor && parseHealthFactor(healthFactor.debt, healthFactor.collateral);

  let afterHealthFactor = beforeHealthFactor;

  useEffect(() => {
    getAmount();
  }, [symbol, qty]);

  async function getAmount() {
    let exchangeRate = 1;

    if (
      parsedSymbol &&
      parsedSymbol.toLowerCase() !== 'dai' &&
      parsedSymbol.toLowerCase() !== 'usdc'
    ) {
      exchangeRate = await getExchangeRate(parsedSymbol);
    }

    const newQty = exchangeRate * parseFloat(qty);

    setNewQty(newQty);
  }

  switch (operation) {
    case 'deposit':
      afterHealthFactor =
        healthFactor &&
        parseHealthFactor(healthFactor.debt, healthFactor.collateral + (newQty || 0));
      break;
    case 'withdraw':
      afterHealthFactor =
        healthFactor &&
        parseHealthFactor(healthFactor.debt, healthFactor.collateral - (newQty || 0));
      break;
    case 'borrow':
      afterHealthFactor =
        healthFactor &&
        parseHealthFactor(healthFactor.debt + (newQty || 0), healthFactor.collateral);
      break;
    case 'repay':
      afterHealthFactor =
        healthFactor &&
        parseHealthFactor(healthFactor.debt - (newQty || 0), healthFactor.collateral);
      break;
  }

  return (
    <section className={`${styles.row} ${styles.line}`}>
      <p className={styles.text}>{translations[lang].healthFactor}</p>
      <section className={styles.values}>
        <span className={styles.value}>{beforeHealthFactor}</span>
        <div className={styles.imageContainer}>
          <Image src="/img/icons/arrowRight.svg" alt="arrowRight" layout="fill" />
        </div>
        <span className={styles.value}>{afterHealthFactor}</span>
      </section>
    </section>
  );
}

export default ModalRowHealthFactor;
