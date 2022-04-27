import { ChangeEventHandler } from 'react';
import styles from './style.module.scss';

type Props = {
  text: string;
  value?: string;
  valueTooltip?: string;
  line?: boolean;
  editable: boolean;
  symbol?: string;
  onChange: ChangeEventHandler;
  onClick: () => void;
};

function ModalRowEditable({ text, value, line, editable, symbol, onChange, onClick }: Props) {
  const rowStyles = line ? `${styles.row} ${styles.line}` : styles.row;
  const blockedCharacters = ['e', 'E', '+', '-'];

  return (
    <section className={rowStyles}>
      <p className={styles.text}>{text}</p>
      <section className={styles.editable}>
        {!editable && <p className={styles.value}>{`${value == '' ? '0.5' : value} ${symbol}`}</p>}
        {editable && (
          <div className={styles.inputContainer}>
            <input
              min={0.0}
              type="number"
              placeholder={'0.5'}
              value={value !== '' ? parseFloat(value!) : ''}
              onChange={onChange}
              name={text}
              className={styles.input}
              onKeyDown={(e) => blockedCharacters.includes(e.key) && e.preventDefault()}
              step="any"
            />
            {symbol && <p className={styles.symbol}>{symbol}</p>}
          </div>
        )}
        <img
          className={styles.arrow}
          src={`/img/icons/${editable ? 'arrowUp' : 'arrowDown'}.svg`}
          onClick={onClick}
        />
      </section>
    </section>
  );
}

export default ModalRowEditable;
