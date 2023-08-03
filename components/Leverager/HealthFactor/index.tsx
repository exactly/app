import React, { useMemo } from 'react';
import { Box, Skeleton, Typography } from '@mui/material';
import { useTranslation } from 'react-i18next';
import useHealthFactor from 'hooks/useHealthFactor';
import parseHealthFactor from 'utils/parseHealthFactor';
import ArrowForwardRoundedIcon from '@mui/icons-material/ArrowForwardRounded';
import { useLeveragerContext } from 'contexts/LeveragerContext';

const HealthFactor = () => {
  const { t } = useTranslation();
  const { newHealthFactor, getHealthFactorColor } = useLeveragerContext();
  const hf = useHealthFactor();

  const healthFactor = useMemo(() => (hf ? parseHealthFactor(hf.debt, hf.collateral) : undefined), [hf]);

  const hfCurrColor = useMemo(() => getHealthFactorColor(healthFactor), [getHealthFactorColor, healthFactor]);
  const hfNewColor = useMemo(() => getHealthFactorColor(newHealthFactor), [getHealthFactorColor, newHealthFactor]);

  return (
    <Box display="flex" flexDirection="column" gap={2}>
      <Box display="flex" justifyContent="space-between" alignItems="center">
        <Typography variant="caption" color="figma.grey.600">
          {t('Account Health Factor')}
        </Typography>
      </Box>
      <Box display="flex" gap={0.8} alignItems="center">
        {healthFactor ? (
          <Typography variant="h6" color={hfCurrColor.color}>
            {healthFactor}
          </Typography>
        ) : (
          <Skeleton width={72} height={36} />
        )}

        <ArrowForwardRoundedIcon sx={{ color: 'blue', fontSize: 14, fontWeight: 600 }} />

        {newHealthFactor ? (
          <Typography variant="h6" color={hfNewColor.color}>
            {newHealthFactor}
          </Typography>
        ) : (
          <Skeleton width={72} height={36} />
        )}
      </Box>
    </Box>
  );
};

export default HealthFactor;
