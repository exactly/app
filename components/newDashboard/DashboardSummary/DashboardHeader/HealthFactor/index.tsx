import React, { useMemo } from 'react';
import { Box, Skeleton, Tooltip, Typography, useTheme } from '@mui/material';
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder';
import { useTranslation } from 'react-i18next';
import useHealthFactor from 'hooks/useHealthFactor';
import parseHealthFactor from 'utils/parseHealthFactor';
import useAccountData from 'hooks/useAccountData';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';

const HealthFactor = () => {
  const { t } = useTranslation();
  const { palette } = useTheme();
  const { isFetching } = useAccountData();
  const hf = useHealthFactor();
  const healthFactor = useMemo(() => (hf ? parseHealthFactor(hf.debt, hf.collateral) : undefined), [hf]);

  const healthFactorColor = useMemo(() => {
    if (!healthFactor) return { color: palette.healthFactor.safe, bg: palette.healthFactor.bg.safe };

    const parsedHF = parseFloat(healthFactor);
    const status = parsedHF < 1 ? 'danger' : parsedHF < 1.05 ? 'warning' : 'safe';
    return { color: palette.healthFactor[status], bg: palette.healthFactor.bg[status] };
  }, [healthFactor, palette.healthFactor]);

  return (
    <Box
      display="flex"
      justifyContent="space-between"
      alignItems="center"
      py={3}
      px={4}
      gap={3}
      borderRadius="8px"
      boxSizing="border-box"
      bgcolor={healthFactorColor.bg}
    >
      <Box display="flex" gap={1} alignItems="center">
        <FavoriteBorderIcon sx={{ fontSize: 16, color: palette.primary.main }} />
        <Typography variant="dashboardTitle" color="primary" noWrap>
          {t('Health Factor')}
        </Typography>
        <Tooltip
          title={t(
            'The Health Factor represents how “safe” your leverage portfolio is, defined as the risk-adjusted proportion of collateral deposited versus the borrowed risk-adjusted amount. A health factor below 1x will be considered with a shortfall and open to liquidation.',
          )}
          placement="bottom"
          arrow
        >
          <InfoOutlinedIcon sx={{ fontSize: 14 }} />
        </Tooltip>
      </Box>
      {isFetching || !healthFactor ? (
        <Skeleton width={100} height={42} />
      ) : (
        <Typography fontSize={28} fontFamily="IBM Plex Mono" color={healthFactorColor.color}>
          {healthFactor}
        </Typography>
      )}
    </Box>
  );
};

export default HealthFactor;
