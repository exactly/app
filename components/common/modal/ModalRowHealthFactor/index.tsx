import { useContext } from 'react';
import Image from 'next/image';

import { HealthFactor } from 'types/HealthFactor';
import { LangKeys } from 'types/Lang';

import parseHealthFactor from 'utils/parseHealthFactor';

import LangContext from 'contexts/LangContext';

import styles from './style.module.scss';

import keys from './translations.json';

type Props = {
  healthFactor?: HealthFactor;
  qty: string;
  operation: string;
};

function ModalRowHealthFactor({ healthFactor, qty, operation }: Props) {
  const lang: string = useContext(LangContext);
  const translations: { [key: string]: LangKeys } = keys;

  const beforeHealthFactor =
    healthFactor && parseHealthFactor(healthFactor.debt, healthFactor.collateral);
  let afterHealthfactor = beforeHealthFactor;

  switch (operation) {
    case 'deposit':
      afterHealthfactor =
        healthFactor &&
        parseHealthFactor(healthFactor.debt, healthFactor.collateral + parseFloat(qty || '0'));
      break;
    case 'withdraw':
      afterHealthfactor =
        healthFactor &&
        parseHealthFactor(healthFactor.debt, healthFactor.collateral - parseFloat(qty || '0'));
      break;
    case 'borrow':
      afterHealthfactor =
        healthFactor &&
        parseHealthFactor(healthFactor.debt + parseFloat(qty || '0'), healthFactor.collateral);
      break;
    case 'repay':
      afterHealthfactor =
        healthFactor &&
        parseHealthFactor(healthFactor.debt - parseFloat(qty || '0'), healthFactor.collateral);
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
        <span className={styles.value}>{afterHealthfactor}</span>
      </section>
    </section>
  );
}

export default ModalRowHealthFactor;
