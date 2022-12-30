import React, { ChangeEventHandler } from 'react';
import { Box } from '@mui/material';

import ModalInput from 'components/common/modal/ModalInput';
import AvailableAmount, { Props as AAProps } from '../AvailableAmount';
import USDValue from '../USDValue';
import AssetSelector from '../AssetSelector';

type Props = {
  qty: string;
  symbol: string;
  onChange: ChangeEventHandler<HTMLInputElement>;
} & AAProps;

function AssetInput({ qty, onChange, symbol, amount, label, onMax }: Props) {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', width: '100%' }}>
      <Box sx={{ marginLeft: -1, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <AssetSelector />
        <ModalInput value={qty} onChange={onChange} symbol={symbol} />
      </Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 0.25, height: 20 }}>
        <AvailableAmount symbol={symbol} label={label} amount={amount} onMax={onMax} />
        <USDValue qty={qty} symbol={symbol} />
      </Box>
    </Box>
  );
}

export default React.memo(AssetInput);
