import React, { ChangeEventHandler } from 'react';
import { InputBase, InputBaseComponentProps } from '@mui/material';
import { NumericFormat } from 'react-number-format';

type CustomProps = {
  decimals: number;
};

const NumberFormatCustom = React.forwardRef<HTMLInputElement, InputBaseComponentProps & CustomProps>(
  function NumberFormatCustom(props, ref) {
    const { onChange, decimals, ...other } = props;

    return (
      <NumericFormat
        {...other}
        getInputRef={ref}
        decimalScale={decimals}
        onChange={onChange}
        allowNegative={false}
        defaultValue={0.0}
      />
    );
  },
);

type Props = {
  name?: string;
  value?: string;
  onChange?: ChangeEventHandler<HTMLInputElement>;
} & CustomProps;

function ModalInput({ value, name, decimals, onChange }: Props) {
  return (
    <InputBase
      inputProps={{
        placeholder: '0',
        min: 0.0,
        name: name,
        step: 'any',
        inputMode: 'decimal',
        style: { padding: 0, textAlign: 'right' },
        value: value,
        onChange: onChange,
        decimals: decimals,
      }}
      autoFocus
      sx={{
        paddingTop: 0.5,
        flexGrow: 1,
        fontWeight: 700,
        fontSize: 24,
      }}
      inputComponent={NumberFormatCustom}
    />
  );
}

export default ModalInput;
