import React, { FC } from 'react';
import Grid from '@mui/material/Grid';
import Typography from '@mui/material/Typography';
import { Skeleton, Tooltip } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import useMediaQuery from '@mui/material/useMediaQuery';

export type ItemInfoProps = {
  label: string;
  value?: string;
  underLabel?: string;
  statusColot?: string;
  tooltipTitle?: string;
};

const ItemInfo: FC<ItemInfoProps> = ({ label, value, underLabel, tooltipTitle }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  return (
    <Grid item xs={isMobile ? 6 : 0}>
      <Tooltip title={tooltipTitle} arrow placement="top">
        <Typography variant="subtitle2" sx={{ color: 'grey.500' }}>
          {label}
        </Typography>
      </Tooltip>
      <Typography variant="h2" component="p">
        {(!!value && value) || <Skeleton height={50} />}
      </Typography>
      {!!underLabel && (
        <Typography variant="subtitle2" sx={{ color: 'grey.500' }}>
          {underLabel}
        </Typography>
      )}
    </Grid>
  );
};

export default ItemInfo;
