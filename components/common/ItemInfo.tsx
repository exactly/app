import React, { FC } from 'react';
import Grid from '@mui/material/Grid';
import Typography from '@mui/material/Typography';
import Skeleton from 'react-loading-skeleton';

export type ItemInfoProps = {
  label: string;
  value?: string;
  underLabel?: string;
};

const ItemInfo: FC<ItemInfoProps> = ({ label, value, underLabel }) => (
  <Grid item sx={{ display: 'flex', flexDirection: 'column' }}>
    <Typography textTransform="uppercase" variant="caption" fontWeight={600}>
      {label}
    </Typography>
    <Typography variant="h5" component="p">
      {(!!value && value) || <Skeleton />}
    </Typography>
    {!!underLabel && (
      <Typography textTransform="uppercase" variant="caption">
        {underLabel}
      </Typography>
    )}
  </Grid>
);

export default ItemInfo;
