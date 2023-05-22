import React, { FC } from 'react';
import { Box, Tooltip, Typography } from '@mui/material';
import { useTranslation } from 'react-i18next';

type OperationLegendProps = {
  type: 'fixed' | 'variable';
  small?: boolean;
  hideTooltip?: boolean;
};

const OperationLegend: FC<OperationLegendProps> = ({ type, small, hideTooltip }) => {
  const { t } = useTranslation();

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
        width={small ? 8 : 16}
        height={small ? 8 : 16}
        borderRadius={small ? '2px' : '4px'}
        sx={{ bgcolor: type === 'fixed' ? 'blue' : 'green', cursor: 'pointer' }}
      />
    </Tooltip>
  );
};

export default OperationLegend;
