import React from 'react';
import { Box, Typography, Avatar, AvatarGroup } from '@mui/material';
import { toPercentage } from 'utils/utils';
import { useTranslation } from 'react-i18next';

const LoopAPR = () => {
  const { t } = useTranslation();

  const rewards = [{ symbol: 'OP' }, { symbol: 'USDC' }, { symbol: 'WBTC' }];

  return (
    <Box display="flex" flexDirection="column" gap={2}>
      <Typography variant="caption" color="figma.grey.600">
        {t('Loop APR')}
      </Typography>
      <Box display="flex" gap={0.5} alignItems="center">
        <Typography variant="h6">{toPercentage(0.137)}</Typography>
        <AvatarGroup max={6} sx={{ '& .MuiAvatar-root': { width: 20, height: 20, fontSize: 10 } }}>
          {rewards.map(({ symbol }) => (
            <Avatar key={symbol} alt={symbol} src={`/img/assets/${symbol}.svg`} />
          ))}
        </AvatarGroup>
      </Box>
    </Box>
  );
};
export default LoopAPR;
