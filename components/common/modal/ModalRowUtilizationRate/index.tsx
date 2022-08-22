import { useContext } from 'react';
import Image from 'next/image';
import Skeleton from 'react-loading-skeleton';

import { LangKeys } from 'types/Lang';

import LangContext from 'contexts/LangContext';

import styles from './style.module.scss';

import keys from './translations.json';

type Props = {
  urBefore: string | undefined;
  urAfter: string | undefined;
  line?: boolean;
};

function ModalRowUtilizationRate({ urBefore, urAfter, line }: Props) {
  const lang: string = useContext(LangContext);
  const translations: { [key: string]: LangKeys } = keys;

  const rowStyles = line ? `${styles.row} ${styles.line}` : styles.row;

  return (
    <section className={rowStyles}>
      <p className={styles.text}>{translations[lang].utilizationRate}</p>
      <section className={styles.values}>
        <span className={styles.value}>{`${urBefore}%` || <Skeleton />}</span>
        <div className={styles.imageContainer}>
          <Image src="/img/icons/arrowRight.svg" alt="arrowRight" layout="fill" />
        </div>
        <span className={styles.value}>{`${urAfter}%` || <Skeleton />}</span>
      </section>
    </section>
  );
}

export default ModalRowUtilizationRate;
