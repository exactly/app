import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Box, Button, Checkbox, Divider, Grid, Skeleton, Typography } from '@mui/material';
import { LoadingButton } from '@mui/lab';
import { ModalBox } from 'components/common/modal/ModalBox';
import ModalAlert from 'components/common/modal/ModalAlert';
import LoadingTransaction from 'components/common/modal/Loading';
import { useTranslation } from 'react-i18next';
import { useLeveragerContext } from 'contexts/LeveragerContext';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { toPercentage } from 'utils/utils';
import USDValue from 'components/OperationsModal/USDValue';
import Image from 'next/image';
import RewardsGroup from '../RewardsGroup';
import handleOperationError from 'utils/handleOperationError';
import formatNumber from 'utils/formatNumber';

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
    setErrorData,
    approve,
    submit,
    needsApproval,
    isLoading,
    errorData,
    tx,
  } = useLeveragerContext();

  const healthFactorColor = useMemo(
    () => getHealthFactorColor(newHealthFactor),
    [getHealthFactorColor, newHealthFactor],
  );

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
            <Typography variant="h6">{formatNumber(newCollateral.display, input.collateralSymbol)}</Typography>
          </Box>
        ),
        subValue: (
          <Box display="flex" justifyContent="end">
            <USDValue qty={newCollateral.display} symbol={input.collateralSymbol || ''} />
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
            <Typography variant="h6">{formatNumber(newBorrow.display, input.borrowSymbol)}</Typography>
          </Box>
        ),
        subValue: (
          <Box display="flex" justifyContent="end">
            <USDValue qty={newBorrow.display} symbol={input.borrowSymbol || ''} />
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
        value: newHealthFactor ? (
          <Typography variant="h6" color={healthFactorColor.color}>
            {newHealthFactor}
          </Typography>
        ) : (
          <Skeleton width={72} height={36} />
        ),
      },
    ],
    [
      healthFactorColor.color,
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

  const [requiresApproval, setRequiresApproval] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        setErrorData(undefined);
        if (!input.collateralSymbol || !input.borrowSymbol) return;
        setRequiresApproval(await needsApproval());
      } catch (e: unknown) {
        setErrorData({ status: true, message: handleOperationError(e) });
      }
    })();
  }, [input.borrowSymbol, input.collateralSymbol, needsApproval, setErrorData]);

  const approveLeverage = useCallback(async () => {
    await approve();
    setRequiresApproval(await needsApproval());
  }, [approve, needsApproval]);

  if (tx) {
    return (
      <LoadingTransaction
        tx={tx}
        messages={{
          pending: input.secondaryOperation === 'deposit' ? t('You are leveraging') : t('You are deleveraging'),
          success:
            input.secondaryOperation === 'deposit'
              ? t('Your position has been leveraged')
              : t('Your position has been deleveraged'),
          error: t('Something went wrong'),
        }}
      />
    );
  }

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
      <Box display="flex" flexDirection="column" gap={errorData?.status ? 1.5 : 3}>
        <Box display="flex" justifyContent="start" alignItems="center" gap={1}>
          <Checkbox
            id="accept-risk"
            sx={{ width: 18, height: 18 }}
            value={acceptedTerms}
            onChange={(e) => setAcceptedTerms(e.target.checked)}
          />
          <Typography component="label" htmlFor="accept-risk" fontSize={14} fontWeight={500} sx={{ cursor: 'pointer' }}>
            {t('I fully acknowledge and accept the risks of leveraging.')}
          </Typography>
        </Box>
        {errorData?.status && <ModalAlert message={errorData.message} variant={errorData.variant} />}
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
            <LoadingButton
              loading={isLoading}
              onClick={requiresApproval ? approveLeverage : submit}
              fullWidth
              variant="contained"
              disabled={disabledConfirm}
            >
              {requiresApproval ? t('Approve') : t('Confirm Leverage')}
            </LoadingButton>
          </Grid>
        </Grid>
      </Box>
    </Box>
  );
};

export default Summary;
