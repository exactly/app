import React, { useCallback, useMemo } from 'react';
import { Box, Skeleton, Typography, useTheme } from '@mui/material';
import { useTranslation } from 'react-i18next';
import useHealthFactor from 'hooks/useHealthFactor';
import parseHealthFactor from 'utils/parseHealthFactor';
import ArrowForwardRoundedIcon from '@mui/icons-material/ArrowForwardRounded';
import { useLeveragerContext } from 'contexts/LeveragerContext';

const HealthFactor = () => {
  const { t } = useTranslation();
  const { input, newHealthFactor, currentLeverageRatio } = useLeveragerContext();
  const hf = useHealthFactor();
  const { palette } = useTheme();

  const healthFactor = useMemo(() => (hf ? parseHealthFactor(hf.debt, hf.collateral) : undefined), [hf]);

  const getHealthFactorColor = useCallback(
    (_healthFactor: string | undefined) => {
      if (!_healthFactor) return { color: palette.healthFactor.safe, bg: palette.healthFactor.bg.safe };
      const parsedHF = parseFloat(_healthFactor);
      const status = parsedHF < 1.01 ? 'danger' : parsedHF < 1.05 ? 'warning' : 'safe';
      return { color: palette.healthFactor[status], bg: palette.healthFactor.bg[status] };
    },
    [palette.healthFactor],
  );

  const getHealthFactorRisk = useCallback(
    (_healthFactor: string | undefined) => {
      if (!_healthFactor) return t('low risk');
      const parsedHF = parseFloat(_healthFactor);
      const risk = parsedHF < 1.01 ? 'high risk' : parsedHF < 1.05 ? 'mid risk' : 'low risk';
      return t(risk);
    },
    [t],
  );

  const hfCurrColor = useMemo(() => getHealthFactorColor(healthFactor), [getHealthFactorColor, healthFactor]);
  const [hfNewColor, nfNewRisk] = useMemo(
    () => [getHealthFactorColor(newHealthFactor), getHealthFactorRisk(newHealthFactor)],
    [getHealthFactorColor, getHealthFactorRisk, newHealthFactor],
  );

  const disabled = useMemo(
    () => !input.collateralSymbol || !input.borrowSymbol || (currentLeverageRatio === 1 && input.leverageRatio === 1),
    [currentLeverageRatio, input.borrowSymbol, input.collateralSymbol, input.leverageRatio],
  );

  return (
    <Box display="flex" flexDirection="column" gap={2}>
      <Box display="flex" justifyContent="space-between" alignItems="center">
        <Typography variant="caption" color="figma.grey.600">
          {t('Health Factor')}
        </Typography>
        <Typography
          fontFamily="IBM Plex Mono"
          fontSize={10}
          fontWeight={500}
          px={0.5}
          py={0.25}
          bgcolor={hfNewColor.bg}
          color={hfNewColor.color}
        >
          {nfNewRisk.toUpperCase()}
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

        {disabled ? (
          <Typography variant="h6">{t('N/A')}</Typography>
        ) : newHealthFactor ? (
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
