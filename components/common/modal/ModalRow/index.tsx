import BeforeAfter from './BeforeAfter';
import styles from './style.module.scss';

type Props = {
  text: string;
  textTooltip?: string;
  value?: string;
  valueTooltip?: string;
  line?: boolean;
  values?: Array<string>;
};

function ModalRow({ text, value, values, line }: Props) {
  const rowStyles = line ? `${styles.row} ${styles.line}` : styles.row;

  return (
    <section className={rowStyles}>
      <p className={styles.text}>{text}</p>

      {value && <p className={styles.value}>{value}</p>}

      {values && <BeforeAfter values={values} />}
    </section>
  );
}

export default ModalRow;
