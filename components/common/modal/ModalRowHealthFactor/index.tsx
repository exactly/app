import Image from 'next/image';
import { HealthFactor } from 'types/HealthFactor';

import parseHealthFactor from 'utils/parseHealthFactor';

import styles from './style.module.scss';

type Props = {
  text: string;
  healthFactor?: HealthFactor;
  qty: string;
  operation: string;
};

function ModalRowHealthFactor({ text, healthFactor, qty, operation }: Props) {
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
      <p className={styles.text}>{text}</p>
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
