import React from 'react';
import { InputBase, InputBaseComponentProps, InputBaseProps } from '@mui/material';
import { NumericFormat } from 'react-number-format';

type CustomProps = {
  decimals: number;
  onValueChange: (value: string) => void;
  'data-testid'?: string;
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
        data-testid={props['data-testid']}
      />
    );
  },
);

type Props = {
  name?: string;
  value?: string;
  symbol?: string;
  maxWidth?: string;
  align?: 'left' | 'center' | 'right';
  disabled?: boolean;
  sx?: InputBaseProps['sx'];
} & CustomProps;

function ModalInput({
  value,
  name,
  decimals,
  onValueChange,
  symbol,
  maxWidth,
  align = 'right',
  disabled = false,
  'data-testid': testId = 'modal-input',
  ...props
}: Props) {
  return (
    <InputBase
      inputProps={{
        placeholder: symbol ? `0 ${symbol}` : '0',
        min: 0.0,
        name: name,
        step: 'any',
        inputMode: 'decimal',
        style: { padding: 0, textAlign: align },
        onValueChange: onValueChange,
        decimals: decimals,
        'data-testid': testId,
      }}
      disabled={disabled}
      value={value}
      autoFocus
      sx={{
        paddingTop: 0.5,
        maxWidth: { xs: maxWidth || '50%', sm: maxWidth || '60%' },
        flexGrow: 1,
        fontWeight: 700,
        fontSize: 24,
        ...props.sx,
      }}
      inputComponent={NumberFormatCustom}
    />
  );
}

export default ModalInput;
