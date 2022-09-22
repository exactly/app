import { formatFixed, parseFixed } from '@ethersproject/bignumber';
import { ChangeEventHandler, MouseEventHandler, useContext, ClipboardEvent, useMemo } from 'react';

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

  const blockedCharacters = ['e', 'E', '+', '-', ','];

  const newValue = useMemo(() => {
    if (!accountData || !value || !symbol) return;

    const decimals = accountData[symbol].decimals;
    const oraclePrice = accountData[symbol].oraclePrice;

    const regex = /[^,.]*$/g;
    const inputDecimals = regex.exec(value)![0];

    if (inputDecimals.length > decimals) return;

    const parsedValue = parseFixed(value, decimals);
    const WAD = parseFixed('1', 18);

    const valueUsd = parsedValue.mul(oraclePrice).div(WAD);

    return formatFixed(valueUsd, decimals);
  }, [symbol, value, accountData]);

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
        {value == '' || !value || !symbol || !newValue
          ? '$0'
          : `$${formatNumber(newValue, symbol)}`}
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
