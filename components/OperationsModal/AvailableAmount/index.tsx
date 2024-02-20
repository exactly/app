import React, { MouseEvent, MouseEventHandler, useCallback } from 'react';
import { Box, Typography, Button, Skeleton, Tooltip } from '@mui/material';

import formatNumber from 'utils/formatNumber';
import { track } from 'utils/mixpanel';

export type Props = {
  symbol: string;
  amount?: string;
  label: string;
  onMax?: MouseEventHandler;
  tooltip?: string;
};

function AvailableAmount({ symbol, amount, label, onMax, tooltip }: Props) {
  const handleMaxClick = useCallback(
    (e: MouseEvent<HTMLButtonElement>): void => {
      track('Button Clicked', {
        location: 'Operations Modal',
        name: 'max',
        symbol,
      });
      onMax?.(e);
    },
    [onMax, symbol],
  );

  return amount ? (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.25 }}>
      <Tooltip title={tooltip} placement="bottom" arrow>
        <Typography color="figma.grey.500" fontSize={12} fontWeight={500} data-testid="modal-amount-info">
          {label}: {formatNumber(amount, symbol)}
        </Typography>
      </Tooltip>
      {Boolean(parseFloat(amount)) && (
        <Button
          onClick={handleMaxClick}
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
          data-testid="modal-on-max"
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
