import React from 'react';
import MaturitySelector from 'components/MaturitySelector';

import styles from './style.module.scss';

type Props = {
  textTooltip?: string;
  text?: string;
  valueTooltip?: string;
  line?: boolean;
  values?: Array<string>;
};

function ModalMaturityEditable({ text, line }: Props) {
  return (
    <section className={line ? `${styles.row} ${styles.line}` : styles.row}>
      <p className={styles.text}>{text}</p>
      <MaturitySelector />
    </section>
  );
}

export default ModalMaturityEditable;
