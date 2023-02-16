import React from 'react';
import { InputBase, InputBaseComponentProps } from '@mui/material';
import { NumericFormat } from 'react-number-format';

type CustomProps = {
  decimals: number;
  onValueChange: (value: string) => void;
};

const NumberFormatCustom = React.forwardRef<HTMLInputElement, InputBaseComponentProps & CustomProps>(
  function NumberFormatCustom(props, ref) {
    const { onValueChange, decimals, ...other } = props;
    return (
      <NumericFormat
        {...other}
        getInputRef={ref}
        decimalScale={decimals}
        onValueChange={({ value }) => {
          switch (true) {
            case value === '.':
              return onValueChange('0.');
            default:
              return onValueChange(value);
          }
        }}
        isAllowed={({ value }) => {
          return !/^0\d/.test(value);
        }}
        allowLeadingZeros={false}
        allowedDecimalSeparators={[',']}
        allowNegative={false}
        defaultValue={0.0}
        thousandSeparator=","
        valueIsNumericString
      />
    );
  },
);

type Props = {
  name?: string;
  value?: string;
} & CustomProps;

function ModalInput({ value, name, decimals, onValueChange }: Props) {
  return (
    <InputBase
      inputProps={{
        placeholder: '0',
        min: 0.0,
        name: name,
        step: 'any',
        inputMode: 'decimal',
        style: { padding: 0, textAlign: 'right' },
        onValueChange: onValueChange,
        decimals: decimals,
      }}
      value={value}
      autoFocus
      sx={{
        paddingTop: 0.5,
        maxWidth: '60%',
        flexGrow: 1,
        fontWeight: 700,
        fontSize: 24,
      }}
      inputComponent={NumberFormatCustom}
    />
  );
}

export default ModalInput;
