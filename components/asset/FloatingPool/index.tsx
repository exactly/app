import React, { FC } from 'react';
import Grid from '@mui/material/Grid';

import FloatingPoolInfo from './FloatingPoolInfo';
// import FloatingAPRChart from './FloatingAPRChart';

type AssetFloatingPoolProps = {
  symbol: string;
  eMarketAddress?: string;
  networkName: string;
};

const AssetFloatingPool: FC<AssetFloatingPoolProps> = ({ symbol, eMarketAddress, networkName }) => {
  return (
    <Grid container padding={2} sx={{ boxShadow: '#A7A7A7 0px 0px 4px 0px', borderRadius: '5px' }}>
      <Grid item xs={12}>
        <FloatingPoolInfo symbol={symbol} eMarketAddress={eMarketAddress} networkName={networkName} />
      </Grid>
      <Grid item xs={12}>
        {/* <FloatingAPRChart networkName={networkName} market={eMarketAddress} /> */}
      </Grid>
    </Grid>
  );
};

export default AssetFloatingPool;
