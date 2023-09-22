import React, { FC } from 'react';
import { Box, Skeleton, Typography } from '@mui/material';
import { useTranslation } from 'react-i18next';
import formatNumber from 'utils/formatNumber';

type Props = {
  votingPower?: number;
};

const VotingPower: FC<Props> = ({ votingPower }) => {
  const { t } = useTranslation();

  return (
    <Box display="flex" flexDirection="column" gap={4}>
      <Box display="flex" justifyContent="space-between" alignItems="center">
        <Typography variant="h6">{t('Voting Power')}</Typography>
        {votingPower === undefined ? (
          <Skeleton width={56} height={40} />
        ) : (
          <Typography fontSize={28} color="grey.700">
            {formatNumber(votingPower, 'USD', true)}
          </Typography>
        )}
      </Box>
      {votingPower === 0 && (
        <Typography fontSize={14} color="grey.500">
          {t('You have no voting power in your connected wallet.')}
        </Typography>
      )}
    </Box>
  );
};

export default React.memo(VotingPower);
