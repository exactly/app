import React from 'react';
import { Box, Button, Typography, useMediaQuery, useTheme } from '@mui/material';
import { useTranslation } from 'react-i18next';

function StartEarning() {
  const { breakpoints } = useTheme();
  const isMobile = useMediaQuery(breakpoints.down('md'));
  const { t } = useTranslation();

  return (
    <Box
      bgcolor="components.bg"
      display="flex"
      flexDirection={{ xs: 'column', md: 'row' }}
      justifyContent="space-between"
      py={3}
      px={4}
      gap={4}
      borderRadius="8px"
    >
      <Typography variant={isMobile ? 'h6' : 'h5'}>
        {t('Unlock the full potential of DeFi, start earning interest today!')}
      </Typography>
      <Box display="flex" gap={1}>
        <Button variant="contained" fullWidth={isMobile}>
          Deposit
        </Button>
        <Button variant="outlined" fullWidth={isMobile}>
          Markets
        </Button>
      </Box>
    </Box>
  );
}

export default StartEarning;
