import React, { FC } from 'react';
import Grid from '@mui/material/Grid';
import Typography from '@mui/material/Typography';
import Skeleton from 'react-loading-skeleton';
import { Tooltip } from '@mui/material';

export type ItemInfoProps = {
  label: string;
  value?: string;
  underLabel?: string;
  statusColot?: string;
  tooltipTitle?: string;
};

const ItemInfo: FC<ItemInfoProps> = ({ label, value, underLabel, tooltipTitle }) => (
  <Grid item sx={{ display: 'flex', flexDirection: 'column' }}>
    <Tooltip title={tooltipTitle} arrow placement="top">
      <Typography variant="subtitle1" sx={{ color: 'grey.500' }}>
        {label}
      </Typography>
    </Tooltip>
    <Typography variant="h5" component="p">
      {(!!value && value) || <Skeleton />}
    </Typography>
    {!!underLabel && (
      <Typography variant="subtitle2" sx={{ color: 'grey.500' }}>
        {underLabel}
      </Typography>
    )}
  </Grid>
);

export default ItemInfo;
