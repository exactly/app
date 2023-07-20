import React from 'react';
import { Box, Typography } from '@mui/material';
import { useTranslation } from 'react-i18next';

const BestPill = React.forwardRef(function BestPill(props, ref) {
  const { t } = useTranslation();
  return (
    <Box
      {...props}
      ref={ref}
      width="fit-content"
      display="flex"
      alignItems="center"
      height="16px"
      py="3px"
      px="6px"
      borderRadius="8px"
      sx={{ background: 'linear-gradient(66.92deg, #00CC68 34.28%, #00CC8F 100%)' }}
    >
      <Typography variant="chip" color="components.bg">
        {t('BEST')}
      </Typography>
    </Box>
  );
});

export default BestPill;
