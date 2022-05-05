import styles from './style.module.scss';

import MaturitySelector from 'components/MaturitySelector';

type Props = {
  textTooltip?: string;
  text?: string;
  valueTooltip?: string;
  line?: boolean;
  values?: Array<string>;
  value?: string;
  fixedLenderContract?: any;
  editable?: boolean;
};

function ModalMaturityEditable({ text, value, line, editable }: Props) {
  const rowStyles = line ? `${styles.row} ${styles.line}` : styles.row;

  return (
    <section className={rowStyles}>
      <p className={styles.text}>{text}</p>
      {!editable && <p className={styles.value}>{value}</p>}
      {editable && <MaturitySelector editable={editable} />}
    </section>
  );
}

export default ModalMaturityEditable;
