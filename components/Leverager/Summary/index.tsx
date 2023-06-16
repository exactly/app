import React, { useMemo } from 'react';
import { Box, Button, Checkbox, Divider, Grid, Typography, capitalize } from '@mui/material';
import { ModalBox } from 'components/common/modal/ModalBox';
import { useTranslation } from 'react-i18next';
import { useLeveragerContext } from 'contexts/LeveragerContext';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { toPercentage } from 'utils/utils';
import USDValue from 'components/OperationsModal/USDValue';
import Image from 'next/image';
import RewardsGroup from '../RewardsGroup';

const Summary = () => {
  const { t } = useTranslation();
  const {
    input,
    loopAPR,
    newHealthFactor,
    newCollateral,
    newBorrow,
    disabledConfirm,
    acceptedTerms,
    setAcceptedTerms,
    setViewSummary,
    getHealthFactorColor,
    getHealthFactorRisk,
  } = useLeveragerContext();

  const healthFactorColor = useMemo(
    () => getHealthFactorColor(newHealthFactor),
    [getHealthFactorColor, newHealthFactor],
  );
  const healthFactorRisk = useMemo(() => getHealthFactorRisk(newHealthFactor), [getHealthFactorRisk, newHealthFactor]);

  const summaryData = useMemo(
    () => [
      {
        label: t('New Collateral'),
        value: (
          <Box display="flex" alignItems="center" gap={0.5}>
            <Image
              src={`/img/assets/${input.collateralSymbol}.svg`}
              alt={input.collateralSymbol || ''}
              width={20}
              height={20}
              style={{
                maxWidth: '100%',
                height: 'auto',
              }}
            />
            <Typography variant="h6">{input.collateralSymbol}</Typography>
            <Typography variant="h6">{newCollateral}</Typography>
          </Box>
        ),
        subValue: (
          <Box display="flex" justifyContent="end">
            <USDValue qty={newCollateral.toString()} symbol={input.collateralSymbol || ''} />
          </Box>
        ),
      },
      {
        label: t('New Borrow'),
        value: (
          <Box display="flex" alignItems="center" gap={0.5}>
            <Image
              src={`/img/assets/${input.borrowSymbol}.svg`}
              alt={input.borrowSymbol || ''}
              width={20}
              height={20}
              style={{
                maxWidth: '100%',
                height: 'auto',
              }}
            />
            <Typography variant="h6">{input.borrowSymbol}</Typography>
            <Typography variant="h6">{newBorrow}</Typography>
          </Box>
        ),
        subValue: (
          <Box display="flex" justifyContent="end">
            <USDValue qty={newBorrow.toString()} symbol={input.borrowSymbol || ''} />
          </Box>
        ),
      },
      {
        label: t('Leverage'),
        value: <Typography variant="h6">{input.leverageRatio.toFixed(1)}x</Typography>,
      },
      {
        label: t('Loop APR'),
        value: (
          <Box display="flex" alignItems="center" gap={0.5}>
            <RewardsGroup size={16} />
            <Typography variant="h6">{toPercentage(loopAPR)}</Typography>
          </Box>
        ),
      },
      {
        label: t('New Health Factor'),
        value: (
          <Typography variant="h6" color={healthFactorColor.color}>
            {newHealthFactor}
          </Typography>
        ),
      },
      {
        label: t('Risk'),
        value: (
          <Typography variant="h6" color={healthFactorColor.color}>
            {capitalize(healthFactorRisk)}
          </Typography>
        ),
      },
    ],
    [
      healthFactorColor.color,
      healthFactorRisk,
      input.borrowSymbol,
      input.collateralSymbol,
      input.leverageRatio,
      loopAPR,
      newBorrow,
      newCollateral,
      newHealthFactor,
      t,
    ],
  );

  return (
    <Box display="flex" flexDirection="column" gap={3}>
      <ModalBox bgcolor="grey.100">
        <Box pt={1}>
          {summaryData.map(({ value, label, subValue }, index) => (
            <Box key={label} display="flex" flexDirection="column">
              <Box display="flex" justifyContent="space-between" alignItems="center" gap={1}>
                <Typography fontSize={13} fontWeight={500} color="figma.grey.500">
                  {label}
                </Typography>
                {value}
              </Box>
              {subValue}
              {Boolean(index !== summaryData.length - 1) && <Divider flexItem sx={{ my: 1 }} />}
            </Box>
          ))}
        </Box>
      </ModalBox>
      <Box display="flex" justifyContent="start" alignItems="center" gap={1}>
        <Checkbox
          sx={{ width: 18, height: 18 }}
          value={acceptedTerms}
          onChange={(e) => setAcceptedTerms(e.target.checked)}
        />
        <Typography fontSize={14} fontWeight={500}>
          {t('I fully acknowledge and accept the risks of leveraging.')}
        </Typography>
      </Box>
      <Grid container spacing={1}>
        <Grid item xs={3}>
          <Button fullWidth variant="outlined" onClick={() => setViewSummary(false)}>
            <Box display="flex" alignItems="center" gap={1}>
              <ArrowBackIcon sx={{ fontSize: 16, ml: -1 }} />
              {t('Back')}
            </Box>
          </Button>
        </Grid>
        <Grid item xs={9}>
          <Button fullWidth variant="contained" disabled={disabledConfirm}>
            {t('Confirm Leverage')}
          </Button>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Summary;
