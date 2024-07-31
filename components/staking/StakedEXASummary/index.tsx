import React from 'react';
import { AvatarGroup, Avatar, Box, Skeleton, Typography } from '@mui/material';

import { useTranslation } from 'react-i18next';
import formatNumber from 'utils/formatNumber';
import { useStakeEXA } from 'contexts/StakeEXAContext';

function StakedEXASummary() {
  const { t } = useTranslation();
  const { totalAssets, rewardsTokens } = useStakeEXA();

  return (
    <Box display="flex" flexDirection={{ xs: 'column', md: 'row' }} gap={7}>
      <Box>
        <Typography variant="h6">{t('Total Exa Staked')}</Typography>
        <Box display="flex" gap={1}>
          {totalAssets === undefined ? (
            <Skeleton variant="text" width={80} />
          ) : (
            <Typography fontSize={32} fontWeight={500}>
              {formatNumber(Number(totalAssets) / 1e18)}
            </Typography>
          )}
          <Typography fontSize={32} fontWeight={500} color="#B4BABF">
            {t('EXA')}
          </Typography>
        </Box>
      </Box>
      <Box>
        <Typography variant="h6">{t('Estimated APR')}</Typography>
        <Box display="flex" gap={1}>
          <Typography fontSize={32} fontWeight={500}>
            {t('0.00%')}
          </Typography>
          {rewardsTokens === undefined ? (
            <Skeleton variant="text" width={80} />
          ) : (
            <AvatarGroup
              max={6}
              sx={{ '& .MuiAvatar-root': { width: 32, height: 32, borderColor: 'transparent' }, alignItems: 'center' }}
            >
              {rewardsTokens.map((symbol) => (
                <Avatar key={symbol} alt={symbol} src={`/img/assets/${symbol}.svg`} />
              ))}
            </AvatarGroup>
          )}
        </Box>
      </Box>
      <Box>
        <Typography variant="h6">{t('Total Fees Shared')}</Typography>
        <Box display="flex" gap={1}>
          <Typography fontSize={32} fontWeight={500}>
            {t('0.00')}
          </Typography>
          <Typography fontSize={32} fontWeight={500} color="#B4BABF">
            {t('USD')}
          </Typography>
        </Box>
      </Box>
    </Box>
  );
}
export default React.memo(StakedEXASummary);
