import React, { FC, useMemo } from 'react';
import { Box, Tooltip, Typography } from '@mui/material';
import { useTranslation } from 'react-i18next';

type OperationLegendProps = {
  type: 'fixed' | 'variable';
  size?: 'small' | 'medium' | 'large';
  hideTooltip?: boolean;
};

const OperationLegend: FC<OperationLegendProps> = ({ type, size = 'large', hideTooltip }) => {
  const { t } = useTranslation();

  const side = useMemo(() => (size === 'large' ? 16 : size === 'medium' ? 12 : 8), [size]);

  return (
    <Tooltip
      title={
        hideTooltip ? (
          ''
        ) : (
          <Typography
            fontWeight={600}
            fontSize={12}
            textTransform="uppercase"
            color={type === 'fixed' ? 'blue' : 'green'}
          >
            {t(type === 'fixed' ? 'Fixed Rate' : 'Variable Rate')?.toUpperCase()}
          </Typography>
        )
      }
      placement="top"
      enterTouchDelay={0}
      arrow
    >
      <Box
        minWidth={side}
        minHeight={side}
        width={side}
        height={side}
        borderRadius={size === 'large' ? '4px' : '2px'}
        sx={{ bgcolor: type === 'fixed' ? 'blue' : 'green', cursor: 'pointer' }}
      />
    </Tooltip>
  );
};

export default OperationLegend;
