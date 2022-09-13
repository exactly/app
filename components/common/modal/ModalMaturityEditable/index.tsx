import dynamic from 'next/dynamic';

import styles from './style.module.scss';

const MaturitySelector = dynamic(() => import('components/MaturitySelector'));

type Props = {
  textTooltip?: string;
  text?: string;
  valueTooltip?: string;
  line?: boolean;
  values?: Array<string>;
  fixedLenderContract?: any;
};

function ModalMaturityEditable({ text, line }: Props) {
  const rowStyles = line ? `${styles.row} ${styles.line}` : styles.row;

  return (
    <section className={rowStyles}>
      <p className={styles.text}>{text}</p>
      <MaturitySelector />
    </section>
  );
}

export default ModalMaturityEditable;
