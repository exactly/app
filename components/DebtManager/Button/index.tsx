import React from 'react';
import { Box, Button, Tooltip, Typography } from '@mui/material';
import type { ButtonProps } from '@mui/material';
import { useTranslation } from 'react-i18next';

export default function RolloverButton({ disabled, ...props }: ButtonProps) {
  if (disabled) {
    return null;
  }

  return (
    <Tooltip
      title={<RolloverTooltip />}
      placement="top"
      PopperProps={{ sx: { '& .MuiTooltip-tooltip': { p: 1 } } }}
      arrow
    >
      <Button {...props} />
    </Tooltip>
  );
}

function RolloverTooltip() {
  const { t } = useTranslation();
  return (
    <Box display="flex" flexDirection="column" alignItems="center" gap={0.5}>
      <Box
        width="fit-content"
        display="flex"
        alignItems="center"
        height="16px"
        py="3px"
        px="6px"
        borderRadius="8px"
        sx={{ background: 'linear-gradient(66.92deg, #00CC68 34.28%, #00CC8F 100%)', textTransform: 'uppercase' }}
      >
        <Typography variant="chip" color="components.bg">
          {t('New')}
        </Typography>
      </Box>
      <Typography fontWeight={500} fontSize={13} color="grey.700">
        {t('Refinance your loan')}
      </Typography>
    </Box>
  );
}
