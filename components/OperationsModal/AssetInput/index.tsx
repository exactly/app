import React from 'react';
import { Box } from '@mui/material';

import ModalInput from 'components/common/modal/ModalInput';
import AvailableAmount, { Props as AAProps } from '../AvailableAmount';
import USDValue from '../USDValue';
import AssetSelector from '../AssetSelector';
import { useWeb3 } from 'hooks/useWeb3';

type Props = {
  qty: string;
  symbol: string;
  decimals: number;
  onChange: (value: string) => void;
  tooltip?: string | null;
} & AAProps;

function AssetInput({ qty, onChange, symbol, decimals, amount, label, onMax, tooltip }: Props) {
  const { isConnected } = useWeb3();

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', width: '100%' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <AssetSelector />
        <ModalInput value={qty} decimals={decimals} onValueChange={onChange} />
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
