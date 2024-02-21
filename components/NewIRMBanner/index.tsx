import React from 'react';
import { Box } from '@mui/material';
import { t } from 'i18next';

export default function NewIRMBanner() {
  if (Date.now() > new Date('2024-02-21T20:30:00Z').getTime()) return null;

  return (
    <Box bgcolor="blue" textAlign="center" p={0.5} color="white">
      {t('The upgrade to the new Interest Rate Model (EXAIP-08) is scheduled for execution today at 8:30 PM UTC')}
    </Box>
  );
}
