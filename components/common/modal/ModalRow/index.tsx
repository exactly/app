import Skeleton from 'react-loading-skeleton';

import styles from './style.module.scss';

type Props = {
  text: string;
  textTooltip?: string;
  value?: string;
  valueTooltip?: string;
  line?: boolean;
};

function ModalRow({ text, value, line }: Props) {
  const rowStyles = line ? `${styles.row} ${styles.line}` : styles.row;

  return (
    <section className={rowStyles}>
      <p className={styles.text}>{text}</p>

      <p className={styles.value}>{value || <Skeleton />}</p>
    </section>
  );
}

export default ModalRow;
