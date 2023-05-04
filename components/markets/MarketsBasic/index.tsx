import React, { FC, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Box, capitalize, Divider, Tooltip, Typography, useTheme } from '@mui/material';
import AssetInput from 'components/OperationsModal/AssetInput';
import { MarketsBasicOption, useMarketsBasic } from 'contexts/MarketsBasicContext';
import { useOperationContext } from 'contexts/OperationContext';
import useAccountData from 'hooks/useAccountData';
import useBalance from 'hooks/useBalance';
import useFloatingPoolAPR from 'hooks/useFloatingPoolAPR';
import usePreviewFixedOperation from 'hooks/usePreviewFixedOperation';
import OperationTabs from './OperationTabs';
import Options from './Options';
import Overview from './Overview';
import MoreSettings from './MoreSettings';
import Submit from './Submit';
import { useModalStatus } from 'contexts/ModalStatusContext';
import ModalAlert from 'components/common/modal/ModalAlert';
import useDepositAtMaturity from 'hooks/useDepositAtMaturity';
import useBorrow from 'hooks/useBorrow';
import useRewards from 'hooks/useRewards';
import numbers from 'config/numbers.json';
import InfoOutlined from '@mui/icons-material/InfoOutlined';
import useTranslateOperation from 'hooks/useTranslateOperation';
import { toPercentage } from 'utils/utils';
import { Zero } from '@ethersproject/constants';
import usePreviousValue from 'hooks/usePreviousValue';

const { minAPRValue } = numbers;

const MarketsBasic: FC = () => {
  const { t } = useTranslation();
  const translateOperation = useTranslateOperation();
  const { palette } = useTheme();
  const { openOperationModal } = useModalStatus();
  const { symbol, operation, selected, setSelected } = useMarketsBasic();
  const { errorData, qty, assetContract, tx } = useOperationContext();
  const { marketAccount } = useAccountData(symbol);
  const walletBalance = useBalance(symbol, assetContract);
  const { options: fixedOptions, loading: loadingFixedOptions } = usePreviewFixedOperation(operation);
  const { handleInputChange: handleDeposit, onMax: onMaxDeposit } = useDepositAtMaturity();
  const { handleBasicInputChange: handleBorrow, onMax: onMaxBorrow, safeMaximumBorrow } = useBorrow();
  const {
    depositAPR: floatingDepositAPR,
    borrowAPR: floatingBorrowAPR,
    loading: loadingFloatingOption,
  } = useFloatingPoolAPR(symbol, qty);

  const { rates } = useRewards();
  const isDeposit = useMemo(() => operation === 'deposit', [operation]);

  const allOptions: MarketsBasicOption[] = useMemo(() => {
    const borrowRewards = rates[symbol]?.map(({ assetSymbol, borrow }) => ({ assetSymbol, rate: borrow }));
    const depositRewards = rates[symbol]?.map(({ assetSymbol, floatingDeposit }) => ({
      assetSymbol,
      rate: floatingDeposit,
    }));

    return [
      ...(loadingFloatingOption
        ? [{ maturity: 0, depositAPR: floatingDepositAPR }]
        : [
            {
              maturity: 0,
              depositAPR: floatingDepositAPR,
              borrowAPR: floatingBorrowAPR,
              depositRewards,
              borrowRewards,
            },
          ]),
      ...(loadingFixedOptions
        ? fixedOptions.map(({ maturity, depositAPR }) => ({ maturity, depositAPR }))
        : fixedOptions.map(({ maturity, depositAPR, borrowAPR, interest, finalAssets }) => ({
            maturity,
            depositAPR,
            borrowAPR,
            borrowRewards,
            interest,
            finalAssets,
          }))),
    ].filter(
      (o) => operation === 'borrow' || o.maturity === 0 || o.depositAPR === undefined || o.depositAPR >= minAPRValue,
    );
  }, [
    fixedOptions,
    floatingBorrowAPR,
    floatingDepositAPR,
    rates,
    symbol,
    operation,
    loadingFixedOptions,
    loadingFloatingOption,
  ]);

  const bestOption = useMemo(() => {
    if (loadingFloatingOption || loadingFixedOptions) {
      return undefined;
    }

    const options = allOptions
      .map(({ maturity, depositAPR, borrowAPR, borrowRewards, depositRewards }) => ({
        maturity,
        apr: (isDeposit ? depositAPR : borrowAPR) || 0,
        rewardAPR:
          (isDeposit
            ? depositRewards?.flatMap(({ rate }) => rate)?.reduce((partialSum, a) => partialSum.add(a), Zero)
            : borrowRewards?.flatMap(({ rate }) => rate)?.reduce((partialSum, a) => partialSum.sub(a), Zero)) || Zero,
      }))
      .map(({ maturity, apr, rewardAPR }) => ({
        maturity,
        apr: parseFloat(apr.toFixed(4)),
        totalAPR: parseFloat((apr + Number(rewardAPR) / 1e18).toFixed(4)),
      }));

    const APRs = options.map(({ totalAPR }) => totalAPR);

    const bestAPR = isDeposit ? Math.max(...APRs) : Math.min(...APRs);

    return options.reverse().find(({ totalAPR }) => totalAPR === bestAPR)?.maturity;
  }, [allOptions, isDeposit, loadingFixedOptions, loadingFloatingOption]);

  const previousBestOption = usePreviousValue(bestOption);

  const currentOption = useMemo(
    () => allOptions.find((option) => option.maturity === selected),
    [allOptions, selected],
  );

  useEffect(() => {
    if (bestOption !== undefined && previousBestOption !== bestOption) {
      setSelected(bestOption);
    }
  }, [bestOption, setSelected, previousBestOption]);

  useEffect(() => {
    if (tx) openOperationModal(`${operation}${currentOption?.maturity ? 'AtMaturity' : ''}`);
  }, [currentOption?.maturity, openOperationModal, operation, tx]);

  return (
    <Box
      display="flex"
      flexDirection="column"
      gap={2}
      maxWidth="100vw"
      sx={{ overflowX: 'hidden' }}
      data-testid="simple-view"
    >
      <Box
        display="flex"
        flexDirection="column"
        p={2}
        gap={1}
        bgcolor="grey.100"
        maxWidth="400px"
        sx={{ borderRadius: '16px' }}
        boxShadow={
          palette.mode === 'light'
            ? '4px 8px 16px rgba(227, 229, 232, 0.5), -4px -8px 16px rgba(248, 249, 249, 0.25)'
            : ''
        }
      >
        <OperationTabs />

        <Box
          display="flex"
          flexDirection="column"
          bgcolor={palette.mode === 'light' ? 'white' : 'figma.grey.50'}
          border={`1px solid ${palette.grey[200]}`}
          borderRadius="8px"
        >
          <Box px={2} py={1.5}>
            <Typography variant="cardTitle" data-testid="simple-view-asset-action">
              {t(`Asset to be {{action}}`, { action: translateOperation(operation, { variant: 'past' }) })}
            </Typography>
            <AssetInput
              qty={qty}
              symbol={symbol}
              decimals={marketAccount?.decimals ?? 18}
              onMax={isDeposit ? onMaxDeposit : onMaxBorrow}
              onChange={isDeposit ? handleDeposit : handleBorrow}
              label={isDeposit ? t('Your balance') : t('Safe borrow limit')}
              amount={isDeposit ? walletBalance : safeMaximumBorrow}
              tooltip={
                isDeposit ? '' : t('The maximum amount you can borrow without putting your health factor at risk')
              }
            />
          </Box>
          <Divider sx={{ borderColor: 'grey.200' }} />
          <Box px={1} py={1.5}>
            <Typography variant="cardTitle" sx={{ px: 1 }}>
              {capitalize(
                t('{{operation}} duration', { operation: translateOperation(operation, { variant: 'noun' }) }) ?? '',
              )}
            </Typography>
            <Tooltip
              title={
                operation === 'deposit'
                  ? t(
                      'Your deposit can be withdrawn at any time, but please keep in mind that if you withdraw it before the maturity date, the current borrow rates will apply.',
                    )
                  : marketAccount &&
                    t(
                      'You can repay your loan at any time before its maturity date. If you do so after the maturity date, a daily interest of {{penaltyRate}} will apply.',
                      {
                        penaltyRate: toPercentage(Number(marketAccount.penaltyRate.mul(86_400)) / 1e18),
                      },
                    )
              }
              placement="top"
              arrow
            >
              <InfoOutlined sx={{ fontSize: '10px', my: 'auto', color: 'figma.grey.500', cursor: 'pointer' }} />
            </Tooltip>

            <Options
              symbol={symbol}
              allOptions={allOptions}
              selected={selected}
              setSelected={setSelected}
              loadingFloatingOption={loadingFloatingOption}
              loadingFixedOptions={loadingFixedOptions}
              operation={operation}
              bestOption={bestOption}
            />
          </Box>
        </Box>

        {Boolean(selected) && Boolean(qty) && Boolean(currentOption) && (
          <Overview symbol={symbol} operation={operation} qty={qty} option={currentOption || {}} />
        )}

        {errorData?.status && <ModalAlert variant={errorData.variant} message={errorData.message} />}

        <Box mt={1}>
          <Submit symbol={symbol} operation={operation} option={currentOption || {}} qty={qty} errorData={errorData} />
        </Box>
      </Box>
      <Box display="flex" flexDirection="column" gap={0} px={1} mt={-0.5}>
        <MoreSettings operation={operation} />
      </Box>
    </Box>
  );
};

export default MarketsBasic;
