import React from 'react';
import { Box, Button, Typography, useMediaQuery, useTheme } from '@mui/material';
import { useTranslation } from 'react-i18next';
import Link from 'next/link';
import useRouter from 'hooks/useRouter';

function StartEarning() {
  const { breakpoints } = useTheme();
  const isMobile = useMediaQuery(breakpoints.down('md'));
  const { t } = useTranslation();
  const { query } = useRouter();

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
      <Link href={{ pathname: `/`, query }} legacyBehavior>
        <Button variant="outlined" fullWidth={isMobile}>
          {t('Markets')}
        </Button>
      </Link>
    </Box>
  );
}

export default StartEarning;
