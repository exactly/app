import React, { FC } from 'react';
import Grid from '@mui/material/Grid';
import Image from 'next/image';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import formatSymbol from 'utils/formatSymbol';
import { getAssetData } from 'utils/assets';
import { getTokenEtherscanUrl, Network } from 'utils/network';
import OrderAction from 'components/OrderAction';

type Props = {
  symbol: string;
  networkName: string;
  assetAddress: string;
};

const AssetHeaderInfo: FC<Props> = ({ symbol, networkName, assetAddress }) => {
  const assetDescription = getAssetData(symbol)?.description;
  const etherscanUrl = getTokenEtherscanUrl(networkName as Network, assetAddress);

  return (
    <Grid container px={4} spacing={1}>
      <Grid item sx={{ display: 'flex', alignItems: 'start', mt: 1, ml: -4 }}>
        <Image src={`/img/assets/${symbol}.svg`} alt={symbol} width={25} height={25} />
      </Grid>
      <Grid item>
        <Typography
          variant="h1"
          sx={{
            display: 'flex',
            alignItems: 'center',
          }}
          component="div"
        >
          {formatSymbol(symbol)}
          <IconButton sx={{ ml: 1 }} size="small" href={etherscanUrl} target="_blank" rel="noopener noreferrer">
            <OpenInNewIcon sx={{ height: '1rem', width: '1rem' }} />
          </IconButton>
        </Typography>
        <Typography color="gray" variant="subtitle1">
          {assetDescription}
        </Typography>
      </Grid>
      <Grid
        item
        sx={{
          display: 'flex',
          flexDirection: 'row-reverse',
          flex: 'auto',
          mr: 2,
        }}
      >
        <OrderAction />
      </Grid>
    </Grid>
  );
};

export default AssetHeaderInfo;
