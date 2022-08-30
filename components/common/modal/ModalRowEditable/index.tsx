import { ChangeEventHandler } from 'react';
import Image from 'next/image';

import styles from './style.module.scss';

type Props = {
  text: string;
  value?: string;
  valueTooltip?: string;
  line?: boolean;
  editable: boolean;
  symbol?: string;
  placeholder?: string;
  onChange: ChangeEventHandler;
  onClick: () => void;
};

function filterPasteValue(e: any) {
  if (e.type == 'paste') {
    const data = e.clipboardData.getData('Text');
    if (/[^\d|\.]+/gi.test(data)) e.preventDefault();
  }
}

function ModalRowEditable({
  text,
  value,
  line,
  editable,
  symbol,
  placeholder,
  onChange,
  onClick
}: Props) {
  const rowStyles = line ? `${styles.row} ${styles.line}` : styles.row;
  const blockedCharacters = ['e', 'E', '+', '-', ','];

  return (
    <section className={rowStyles}>
      <p className={styles.text}>{text}</p>
      <section className={styles.editable}>
        {!editable && (
          <p className={styles.value}>{`${value == '' ? placeholder ?? '0.00' : value}${
            symbol ? symbol : ''
          }`}</p>
        )}
        {editable && (
          <div className={styles.inputContainer}>
            <input
              min={0.0}
              type="number"
              placeholder={placeholder ?? '0.00'}
              value={value !== '' ? parseFloat(value!) : ''}
              onChange={onChange}
              name={text}
              className={styles.input}
              onKeyDown={(e) => blockedCharacters.includes(e.key) && e.preventDefault()}
              onPaste={(e) => filterPasteValue(e)}
              step="any"
              autoFocus
            />
            {symbol && <p className={styles.symbol}>{symbol}</p>}
          </div>
        )}
        <div className={styles.arrow}>
          <Image
            src={`/img/icons/${editable ? 'arrowUp' : 'arrowDown'}.svg`}
            alt="arrow"
            onClick={onClick}
            width={12}
            height={7}
          />
        </div>
      </section>
    </section>
  );
}

export default ModalRowEditable;
