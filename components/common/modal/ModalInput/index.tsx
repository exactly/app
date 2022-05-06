import { useState, ChangeEventHandler, MouseEventHandler, useEffect } from 'react';

import getExchangeRate from 'utils/getExchangeRate';

import styles from './style.module.scss';

type Props = {
  value?: string;
  name?: string;
  disabled?: boolean;
  symbol?: string;
  onChange?: ChangeEventHandler;
  onMax?: MouseEventHandler;
};

function ModalInput({ value, name, disabled, symbol, onChange, onMax }: Props) {
  const [exchangeRate, setExchangeRate] = useState(1);

  const blockedCharacters = ['e', 'E', '+', '-'];

  useEffect(() => {
    if (!symbol || symbol.toLocaleLowerCase() === 'dai' || symbol.toLocaleLowerCase() === 'usdc')
      return;

    getRate();
  }, [symbol]);

  async function getRate() {
    const rate = await getExchangeRate(symbol!);
    setExchangeRate(rate);
  }

  return (
    <section className={styles.inputSection}>
      <input
        min={0.0}
        type="number"
        placeholder={'0'}
        value={value}
        onChange={onChange}
        name={name}
        disabled={disabled}
        className={styles.input}
        onKeyDown={(e) => blockedCharacters.includes(e.key) && e.preventDefault()}
        step="any"
        autoFocus
      />
      <p className={styles.translatedValue}>
        $ {value == '' || !value ? 0 : (parseFloat(value) * exchangeRate).toFixed(2)}
      </p>
      {onMax && (
        <p className={styles.max} onClick={onMax}>
          MAX
        </p>
      )}
    </section>
  );
}

export default ModalInput;
