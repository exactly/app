import React from 'react';
import { Box, Divider, Skeleton, Typography } from '@mui/material';
import PaidRoundedIcon from '@mui/icons-material/PaidRounded';
import { useTranslation } from 'react-i18next';
import useNetAPR from 'hooks/useNetAPR';
import { toPercentage } from 'utils/utils';
import formatNumber from 'utils/formatNumber';

const NetEarnings = () => {
  const { t } = useTranslation();
  const { netAPR, netPosition } = useNetAPR();

  return (
    <Box
      display="flex"
      flexDirection="column"
      justifyContent="space-between"
      p={4}
      gap={2}
      borderRadius="8px"
      boxSizing="border-box"
      bgcolor="components.bg"
    >
      <Box display="flex" gap={1} alignItems="center">
        <PaidRoundedIcon sx={{ fontSize: 16 }} />
        <Typography variant="dashboardTitle">{t('Your Account')}</Typography>
      </Box>
      <Box display="flex" flexDirection="column" gap={1}>
        <Box display="flex" justifyContent="space-between" alignItems="center" gap={1}>
          <Typography variant="dashboardSubtitleNumber" color="grey.700">
            {t('Net APR')}
          </Typography>
          {netAPR !== undefined ? (
            <Typography fontSize={28} fontWeight={700}>
              {toPercentage(Number(netAPR) / 1e18)}
            </Typography>
          ) : (
            <Skeleton width={100} height={42} />
          )}
        </Box>
        <Divider flexItem />
        <Box display="flex" justifyContent="space-between" alignItems="center" gap={1}>
          <Typography variant="dashboardSubtitleNumber" color="grey.700">
            {t('Net Position')}
          </Typography>
          {netPosition !== undefined ? (
            <Typography fontSize={28}>${formatNumber(Number(netPosition) / 1e18)}</Typography>
          ) : (
            <Skeleton width={100} height={42} />
          )}
        </Box>
      </Box>
    </Box>
  );
};

export default NetEarnings;
