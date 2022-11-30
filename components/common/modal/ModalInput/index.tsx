import React, {
  ChangeEvent,
  ChangeEventHandler,
  KeyboardEvent,
  MouseEventHandler,
  useCallback,
  useMemo,
  ClipboardEvent,
  useRef,
} from 'react';
import { formatFixed, parseFixed } from '@ethersproject/bignumber';
import useAccountData from 'hooks/useAccountData';
import { WeiPerEther } from '@ethersproject/constants';

import formatNumber from 'utils/formatNumber';

import styles from './style.module.scss';

type Props = {
  value?: string;
  name?: string;
  disabled?: boolean;
  symbol: string;
  error?: boolean;
  onChange?: ChangeEventHandler<HTMLInputElement>;
  onMax?: MouseEventHandler;
};

function ModalInput({ value, name, disabled, symbol, error, onChange, onMax }: Props) {
  const { decimals, usdPrice } = useAccountData(symbol);
  const prev = useRef('');

  const isValid = useCallback(
    (v: string): boolean => {
      const regex = new RegExp(`^\\d*([.,]\\d{1,${decimals ?? 18}})?$`, 'g');
      return regex.test(v);
    },
    [decimals],
  );

  const usdValue = useMemo(() => {
    if (!value || !decimals || !usdPrice) return;

    if (!isValid(value)) return;

    const parsedValue = parseFixed(value, decimals);
    const usd = parsedValue.mul(usdPrice).div(WeiPerEther);

    return formatFixed(usd, decimals);
  }, [isValid, value, decimals, usdPrice]);

  const onChangeCallback = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      const { value: currentValue } = e.currentTarget;
      if (!isValid(currentValue)) {
        return e.preventDefault();
      }

      prev.current = currentValue;

      onChange?.(e);
    },
    [isValid, onChange],
  );

  const onPaste = useCallback(
    (e: ClipboardEvent<HTMLInputElement>) => {
      const text = e.clipboardData.getData('text');
      if (!isValid(text)) {
        return e.preventDefault();
      }

      prev.current = text;
    },
    [isValid],
  );

  const onInput = useCallback((e: KeyboardEvent<HTMLInputElement>) => {
    const { validity } = e.currentTarget;
    if (validity.valid) {
      return true;
    }
    e.currentTarget.value = prev.current;
  }, []);

  return (
    <section className={error ? styles.error : styles.inputSection}>
      <input
        min={0.0}
        type="number"
        placeholder="0"
        value={value}
        onChange={onChangeCallback}
        name={name}
        disabled={disabled}
        className={styles.input}
        onPaste={onPaste}
        onInput={onInput}
        step="any"
        autoFocus
      />
      <p className={styles.translatedValue}>${formatNumber(usdValue || '0', 'USD')}</p>
      {onMax && (
        <p className={styles.max} onClick={onMax}>
          MAX
        </p>
      )}
    </section>
  );
}

export default ModalInput;
