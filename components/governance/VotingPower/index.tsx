import React from 'react';
import { Box, Skeleton, Typography } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { useEXAGetVotes } from 'hooks/useEXA';
import { formatEther } from 'viem';
import formatNumber from 'utils/formatNumber';

const VotingPower = () => {
  const { t } = useTranslation();
  const { data: votes, isLoading } = useEXAGetVotes({ watch: true });

  return (
    <Box display="flex" flexDirection="column" gap={4}>
      <Box display="flex" justifyContent="space-between" alignItems="center">
        <Typography variant="h6">{t('Voting Power')}</Typography>
        {votes === undefined || isLoading ? (
          <Skeleton width={56} height={40} />
        ) : (
          <Typography fontSize={28} color="grey.700">
            {formatNumber(formatEther(votes))}
          </Typography>
        )}
      </Box>
      {votes === 0n && (
        <Typography fontSize={14} color="grey.500">
          {t('You have no voting power in your connected wallet.')}
        </Typography>
      )}
    </Box>
  );
};

export default VotingPower;
