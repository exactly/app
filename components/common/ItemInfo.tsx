import React, { FC } from 'react';
import Grid from '@mui/material/Grid';
import Typography from '@mui/material/Typography';
import { Skeleton, Tooltip } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import useMediaQuery from '@mui/material/useMediaQuery';

export type ItemInfoProps = {
  label: string;
  value?: string | React.ReactNode;
  underLabel?: string;
  statusColot?: string;
  tooltipTitle?: string;
  xs?: number;
};

const ItemInfo: FC<ItemInfoProps> = ({ label, value, underLabel, tooltipTitle, xs }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  return (
    <Grid item xs={isMobile ? 6 : xs ? xs : 0}>
      <Tooltip title={tooltipTitle} arrow placement="top">
        <Typography variant="subtitle1" fontSize="10px" color="grey.500" textTransform="uppercase">
          {label}
        </Typography>
      </Tooltip>
      {value ? (
        typeof value === 'string' ? (
          <Typography variant="h5" fontWeight={700} component="p">
            {value}
          </Typography>
        ) : (
          value
        )
      ) : (
        <Skeleton height={50} />
      )}
      {!!underLabel && (
        <Typography variant="subtitle1" fontSize="10px" color="grey.500" textTransform="uppercase">
          {underLabel}
        </Typography>
      )}
    </Grid>
  );
};

export default ItemInfo;
