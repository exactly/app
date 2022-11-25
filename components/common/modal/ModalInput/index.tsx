import { formatFixed, parseFixed } from '@ethersproject/bignumber';
import React, {
  ChangeEventHandler,
  MouseEventHandler,
  useContext,
  ClipboardEvent,
  KeyboardEvent,
  useMemo,
  useCallback,
  useRef,
} from 'react';

import AccountDataContext from 'contexts/AccountDataContext';

import formatNumber from 'utils/formatNumber';

import styles from './style.module.scss';
import { WeiPerEther } from '@ethersproject/constants';

type Props = {
  value: string;
  name?: string;
  disabled?: boolean;
  symbol: string;
  error?: boolean;
  onChange?: ChangeEventHandler<HTMLInputElement>;
  onMax?: MouseEventHandler;
};

const filterKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
  const blockedCharacters = ['e', 'E', '+', '-', ','];
  if (blockedCharacters.includes(e.key)) {
    e.preventDefault();
  }
};

function ModalInput({ value, name, disabled, symbol, error, onChange, onMax }: Props) {
  const ref = useRef<HTMLInputElement>(null);
  const { accountData } = useContext(AccountDataContext);

  const newValue = useMemo(() => {
    if (!accountData || !value) return;

    const { decimals, usdPrice } = accountData[symbol];

    const regex = /[^,.]*$/g;
    const inputDecimals = regex.exec(value)![0];

    if (inputDecimals.length > decimals) return;

    const parsedValue = parseFixed(value, decimals);

    const valueUsd = parsedValue.mul(usdPrice).div(WeiPerEther);

    return formatFixed(valueUsd, decimals);
  }, [symbol, value, accountData]);

  const filterPasteValue = useCallback((e: ClipboardEvent<HTMLInputElement>) => {
    if (e.type !== 'paste') {
      return;
    }

    const data = e.clipboardData.getData('text');
    if (!/^(\d*[.,])?\d+$/gi.test(data)) {
      e.preventDefault();
    }

    if (data.includes(',') && ref.current) {
      e.preventDefault();
      ref.current.value = data.replaceAll(',', '.');
      ref.current.dispatchEvent(new Event('change', { bubbles: true }));
    }
  }, []);

  return (
    <section className={error ? styles.error : styles.inputSection}>
      <input
        ref={ref}
        min={0.0}
        type="number"
        placeholder="0"
        value={value}
        onChange={onChange}
        name={name}
        disabled={disabled}
        className={styles.input}
        onKeyDown={filterKeyDown}
        onPasteCapture={filterPasteValue}
        step="any"
        autoFocus
      />
      <p className={styles.translatedValue}>{`$${formatNumber(newValue || 0, 'USD')}`}</p>
      {onMax && (
        <p className={styles.max} onClick={onMax}>
          MAX
        </p>
      )}
    </section>
  );
}

export default ModalInput;
