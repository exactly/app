import React, { MouseEventHandler } from 'react';
import { Box, Typography, Button, Skeleton } from '@mui/material';

import formatNumber from 'utils/formatNumber';

export type Props = {
  symbol: string;
  amount?: string;
  label: string;
  onMax?: MouseEventHandler;
};

function AvailableAmount({ symbol, amount, label, onMax }: Props) {
  return amount ? (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
      <Typography color="grey.600" fontSize={14} fontWeight={500}>
        {label}: {formatNumber(amount, symbol)}
      </Typography>
      <Button
        onClick={onMax}
        sx={{
          textTransform: 'uppercase',
          borderRadius: 1,
          p: 0.5,
          minWidth: 'fit-content',
          height: 'fit-content',
          color: 'grey.600',
          fontWeight: 700,
          fontSize: 12,
        }}
      >
        Max
      </Button>
    </Box>
  ) : (
    <Skeleton width={200} />
  );
}

export default React.memo(AvailableAmount);
