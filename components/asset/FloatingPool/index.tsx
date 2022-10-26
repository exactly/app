import { FC } from 'react';
import Grid from '@mui/material/Grid';

import FloatingPoolInfo from './FloatingPoolInfo';
import FloatingAPRChart from './FloatingAPRChart';

type AssetFloatingPoolProps = {
  symbol: string;
  eMarketAddress?: string;
  networkName: string;
};

const AssetFloatingPool: FC<AssetFloatingPoolProps> = ({ symbol, eMarketAddress, networkName }) => {
  return (
    <Grid container spacing={2}>
      <Grid item xs={12}>
        <FloatingPoolInfo symbol={symbol} eMarketAddress={eMarketAddress} networkName={networkName} />
      </Grid>
      <Grid item xs={12}>
        <FloatingAPRChart networkName={networkName} market={eMarketAddress} />
      </Grid>
    </Grid>
  );
};

export default AssetFloatingPool;
