import React from 'react';
import Skeleton from 'react-loading-skeleton';
import Image from 'next/image';

import styles from './style.module.scss';

type Props = {
  text: string;
  textTooltip?: string;
  value?: string;
  valueTooltip?: string;
  line?: boolean;
  asset?: string;
};

function ModalRow({ text, value, line, asset }: Props) {
  return (
    <section className={line ? `${styles.row} ${styles.line}` : styles.row}>
      <p className={styles.text}>{text}</p>

      <section className={styles.valueContainer}>
        {asset && <Image src={`/img/assets/${asset}.svg`} alt={asset} width="24" height="24" />}

        <p className={styles.value}>{value || <Skeleton />}</p>
      </section>
    </section>
  );
}

export default ModalRow;
