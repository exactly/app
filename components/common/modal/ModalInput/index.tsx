import { ethers } from 'ethers';
import {
  useState,
  ChangeEventHandler,
  MouseEventHandler,
  useEffect,
  useContext,
  ClipboardEvent
} from 'react';

import AccountDataContext from 'contexts/AccountDataContext';

import formatNumber from 'utils/formatNumber';

import styles from './style.module.scss';

type Props = {
  value?: string;
  name?: string;
  disabled?: boolean;
  symbol?: string;
  error?: boolean;
  onChange?: ChangeEventHandler;
  onMax?: MouseEventHandler;
};

function ModalInput({ value, name, disabled, symbol, error, onChange, onMax }: Props) {
  const { accountData } = useContext(AccountDataContext);

  const [exchangeRate, setExchangeRate] = useState(1);

  const blockedCharacters = ['e', 'E', '+', '-', ','];

  useEffect(() => {
    getRate();
  }, [symbol]);

  async function getRate() {
    if (!accountData || !symbol) return;

    const rate = parseFloat(ethers.utils.formatEther(accountData[symbol].oraclePrice));
    setExchangeRate(rate);
  }

  function filterPasteValue(e: ClipboardEvent<HTMLInputElement>) {
    if (e.type == 'paste') {
      const data = e.clipboardData.getData('Text');
      if (/[^\d|\.]+/gi.test(data)) e.preventDefault();
    }
  }

  return (
    <section className={error ? styles.error : styles.inputSection}>
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
        onPaste={(e) => filterPasteValue(e)}
        step="any"
        autoFocus
      />
      <p className={styles.translatedValue}>
        ${' '}
        {value == '' || !value || !symbol
          ? 0
          : formatNumber(parseFloat(value) * exchangeRate, symbol)}
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
