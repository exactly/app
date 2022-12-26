import React, {
  ChangeEvent,
  ChangeEventHandler,
  KeyboardEvent,
  useCallback,
  // useMemo,
  ClipboardEvent,
  useRef,
} from 'react';
import { InputBase } from '@mui/material';
import useAccountData from 'hooks/useAccountData';

import { checkPrecision } from 'utils/utils';

type Props = {
  name?: string;
  value?: string;
  symbol: string;
  error?: boolean;
  onChange?: ChangeEventHandler<HTMLInputElement>;
};

function ModalInput({ value, name, symbol, onChange }: Props) {
  const { decimals } = useAccountData(symbol);
  const prev = useRef('');

  const isValid = useCallback((v: string): boolean => checkPrecision(v, decimals), [decimals]);

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
    <InputBase
      inputProps={{
        min: 0.0,
        type: 'number',
        placeholder: '0',
        name: name,
        step: 'any',
        style: { padding: 0, textAlign: 'right' },
        value: value,
        onChange: onChangeCallback,
        onPaste: onPaste,
        onInput: onInput,
      }}
      autoFocus
      sx={{
        paddingTop: 0.5,
        flexGrow: 1,
        fontWeight: 700,
        fontSize: 24,
      }}
    />
  );
}

export default ModalInput;
