import React, { MouseEventHandler } from 'react';
import { Box, Typography, Button, Skeleton, Tooltip } from '@mui/material';

import formatNumber from 'utils/formatNumber';

export type Props = {
  symbol: string;
  amount?: string;
  label: string;
  onMax?: MouseEventHandler;
  tooltip?: string;
};

function AvailableAmount({ symbol, amount, label, onMax, tooltip }: Props) {
  return amount ? (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.25 }}>
      <Tooltip title={tooltip} placement="bottom" arrow>
        <Typography color="figma.grey.500" fontSize={12} fontWeight={500}>
          {label}: {formatNumber(amount, symbol)}
        </Typography>
      </Tooltip>
      {Boolean(parseFloat(amount)) && (
        <Button
          onClick={onMax}
          sx={{
            textTransform: 'uppercase',
            borderRadius: 1,
            p: 0.5,
            minWidth: 'fit-content',
            height: 'fit-content',
            color: 'figma.grey.500',
            fontWeight: 600,
            fontSize: 12,
          }}
        >
          Max
        </Button>
      )}
    </Box>
  ) : (
    <Skeleton width={200} />
  );
}

export default React.memo(AvailableAmount);
