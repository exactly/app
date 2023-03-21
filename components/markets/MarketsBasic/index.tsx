import React, { FC, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Box, Divider, Tooltip, Typography, useTheme } from '@mui/material';
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

const { minAPRValue } = numbers;

const MarketsBasic: FC = () => {
  const { t } = useTranslation();
  const translateOperation = useTranslateOperation();
  const { palette } = useTheme();
  const { openOperationModal } = useModalStatus();
  const { symbol = 'USDC', operation, selected, setSelected } = useMarketsBasic();
  const { errorData, requiresApproval, qty, assetContract, tx } = useOperationContext();
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
    const options = allOptions
      .map(({ maturity, depositAPR, borrowAPR }) => ({
        maturity,
        apr: isDeposit ? depositAPR : borrowAPR,
      }))
      .map((option) => ({ ...option, apr: parseFloat((option.apr || 0).toFixed(4)) }));

    const APRs = options.map(({ apr }) => apr);

    const bestAPR = isDeposit ? Math.max(...APRs) : Math.min(...APRs);

    return options.reverse().find(({ apr }) => apr === bestAPR)?.maturity;
  }, [allOptions, isDeposit]);

  const currentOption = useMemo(
    () => allOptions.find((option) => option.maturity === selected),
    [allOptions, selected],
  );

  useEffect(() => setSelected(bestOption ?? 0), [bestOption, setSelected]);

  useEffect(() => {
    if (tx) openOperationModal(`${operation}${currentOption?.maturity ? 'AtMaturity' : ''}`);
  }, [currentOption?.maturity, openOperationModal, operation, tx]);

  return (
    <Box display="flex" flexDirection="column" gap={2} maxWidth="100vw" sx={{ overflowX: 'hidden' }}>
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
            <Typography variant="cardTitle">
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
              {t('{{operation}} duration', { operation: operation === 'borrow' ? t('Borrow') : t('Deposit') })}
            </Typography>
            <Tooltip
              title={
                operation === 'deposit'
                  ? t(
                      'Your deposit can be withdrawn at any time, but please keep in mind that if you withdraw it before the maturity date, the current protocol rates will apply.',
                    )
                  : t(
                      'You can repay your loan at any time before its maturity date. If you do so after the maturity date, a daily interest of 2% will apply.',
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

        {errorData?.status && <ModalAlert variant={errorData.variant || 'error'} message={errorData.message} />}

        <Box mt={1}>
          <Submit
            symbol={symbol}
            operation={operation}
            option={currentOption || {}}
            qty={qty}
            errorData={errorData}
            requiresApproval={requiresApproval}
          />
        </Box>
      </Box>
      <Box display="flex" flexDirection="column" gap={0} px={1} mt={-0.5}>
        <MoreSettings operation={operation} />
      </Box>
    </Box>
  );
};

export default MarketsBasic;
