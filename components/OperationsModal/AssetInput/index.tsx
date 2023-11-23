import React, { useCallback } from 'react';
import { Box } from '@mui/material';

import ModalInput from 'components/OperationsModal/ModalInput';
import AvailableAmount, { Props as AAProps } from '../AvailableAmount';
import USDValue from '../USDValue';
import AssetSelector from '../AssetSelector';
import { useWeb3 } from 'hooks/useWeb3';
import { track } from 'utils/segment';

type Props = {
  qty: string;
  symbol: string;
  decimals: number;
  onChange: (value: string) => void;
  tooltip?: string;
} & AAProps;

function AssetInput({ qty, onChange, symbol, decimals, amount, label, onMax, tooltip }: Props) {
  const { isConnected } = useWeb3();

  const handleBlur = useCallback(() => {
    track('Input Unfocused', {
      name: 'asset',
      location: 'Operations Modal',
      symbol,
      value: qty,
      text: label,
    });
  }, [label, qty, symbol]);

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', width: '100%' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <AssetSelector />
        <ModalInput value={qty} decimals={decimals} onValueChange={onChange} onBlur={handleBlur} />
      </Box>
      <Box
        sx={{
          display: 'flex',
          justifyContent: isConnected ? 'space-between' : 'right',
          alignItems: 'center',
          marginTop: 0.25,
          height: 20,
        }}
      >
        {isConnected && (
          <AvailableAmount symbol={symbol} label={label} amount={amount} onMax={onMax} tooltip={tooltip} />
        )}
        <USDValue qty={qty} symbol={symbol} />
      </Box>
    </Box>
  );
}

export default React.memo(AssetInput);
