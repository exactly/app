import React, { FC } from 'react';
import Grid from '@mui/material/Grid';

import FloatingPoolInfo from './FloatingPoolInfo';
// import FloatingAPRChart from './FloatingAPRChart';

type AssetFloatingPoolProps = {
  symbol: string;
  eMarketAddress?: string;
};

const AssetFloatingPool: FC<AssetFloatingPoolProps> = ({ symbol, eMarketAddress }) => {
  return (
    <Grid
      item
      xs={12}
      width={'100%'}
      boxShadow="0px 4px 12px rgba(175, 177, 182, 0.2)"
      borderRadius="0px 0px 6px 6px"
      bgcolor="white"
      borderTop="4px solid #33CC59"
    >
      <FloatingPoolInfo symbol={symbol} eMarketAddress={eMarketAddress} />
    </Grid>
  );
};

export default AssetFloatingPool;
