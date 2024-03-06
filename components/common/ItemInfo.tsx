import React, { FC } from 'react';
import Grid from '@mui/material/Grid';
import Typography from '@mui/material/Typography';
import { Box, BoxProps, Skeleton, Tooltip } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import useMediaQuery from '@mui/material/useMediaQuery';
import InfoOutlined from '@mui/icons-material/InfoOutlined';

export type ItemInfoProps = {
  label: string;
  value?: string | React.ReactNode;
  underLabel?: string;
  tooltipTitle?: string;
  xs?: number;
  sx?: BoxProps['sx'];
};

const ItemInfo: FC<ItemInfoProps> = ({ label, value, underLabel, tooltipTitle, xs, sx }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  return (
    <Grid item xs={isMobile ? 6 : xs ? xs : 0}>
      <Tooltip title={tooltipTitle} arrow placement="top" sx={{ cursor: tooltipTitle ? 'pointer' : '' }}>
        <Box display="flex" gap={0.5}>
          <Typography variant="subtitle1" fontSize="10px" color="grey.500" textTransform="uppercase">
            {label}
          </Typography>
          {tooltipTitle && <InfoOutlined sx={{ fontSize: '10px', my: 'auto', color: 'figma.grey.500' }} />}
        </Box>
      </Tooltip>
      {value ? (
        typeof value === 'string' ? (
          <Typography variant="h5" fontWeight={700} component="p" sx={sx}>
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
