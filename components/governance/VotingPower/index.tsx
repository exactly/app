import React from 'react';
import { Box, Typography } from '@mui/material';
import { useTranslation } from 'react-i18next';

const VotingPower = () => {
  const { t } = useTranslation();

  return (
    <Box display="flex" flexDirection="column" gap={4}>
      <Box display="flex" justifyContent="space-between" alignItems="center">
        <Typography variant="h6">{t('Voting Power')}</Typography>
        <Typography fontSize={28} color="grey.700">
          0
        </Typography>
      </Box>
      <Typography fontSize={14} color="grey.500">
        {t('You have no EXA balance in your connected wallet.')}
      </Typography>
    </Box>
  );
};

export default VotingPower;
