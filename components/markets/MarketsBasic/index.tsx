import React, { FC, useEffect, useMemo } from 'react';
import { Box, Divider, Typography } from '@mui/material';
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

const { minAPRValue } = numbers;

const MarketsBasic: FC = () => {
  const { openOperationModal } = useModalStatus();
  const { symbol = 'DAI', operation, selected, setSelected } = useMarketsBasic();
  const { errorData, requiresApproval, qty, assetContract, tx } = useOperationContext();
  const { decimals = 18 } = useAccountData(symbol);
  const walletBalance = useBalance(symbol, assetContract);
  const { options: fixedOptions, loading: loadingFixedOptions } = usePreviewFixedOperation(operation);
  const { handleInputChange: handleDeposit, onMax: onMaxDeposit } = useDepositAtMaturity();
  const { handleBasicInputChange: handleBorrow, onMax: onMaxBorrow, safeMaximumBorrow } = useBorrow();
  const {
    depositAPR: floatingDepositAPR,
    borrowAPR: floatingBorrowAPR,
    loading: loadingFloatingOption,
  } = useFloatingPoolAPR(symbol);

  const { rates } = useRewards();
  const isDeposit = useMemo(() => operation === 'deposit', [operation]);

  const allOptions: MarketsBasicOption[] = useMemo(() => {
    const borrowRewards = rates[symbol]?.map(({ assetSymbol, borrow }) => ({ assetSymbol, rate: borrow }));
    return [
      {
        maturity: 0,
        depositAPR: floatingDepositAPR,
        borrowAPR: floatingBorrowAPR,
        depositRewards: rates[symbol]?.map(({ assetSymbol, floatingDeposit }) => ({
          assetSymbol,
          rate: floatingDeposit,
        })),
        borrowRewards,
      },
      ...fixedOptions.map(({ maturity, depositAPR, borrowAPR }) => ({
        maturity,
        depositAPR,
        borrowAPR,
        borrowRewards,
      })),
    ].filter(
      (o) => operation === 'borrow' || o.maturity === 0 || o.depositAPR === undefined || o.depositAPR >= minAPRValue,
    );
  }, [fixedOptions, floatingBorrowAPR, floatingDepositAPR, rates, symbol, operation]);

  const bestOption = useMemo(() => {
    const options = allOptions
      .filter(({ maturity }) => maturity && maturity !== 0)
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
        boxShadow="4px 8px 16px rgba(227, 229, 232, 0.5), -4px -8px 16px rgba(248, 249, 249, 0.25)"
      >
        <OperationTabs />

        <Box display="flex" flexDirection="column" bgcolor="white" border="1px solid #EDF0F2" borderRadius="8px">
          <Box px={2} py={1.5}>
            <Typography variant="cardTitle">{`Asset to be ${isDeposit ? 'deposited' : 'borrowed'}`}</Typography>
            <AssetInput
              qty={qty}
              symbol={symbol}
              decimals={decimals}
              onMax={isDeposit ? onMaxDeposit : onMaxBorrow}
              onChange={isDeposit ? handleDeposit : handleBorrow}
              label={isDeposit ? 'Your balance' : 'Safe borrow limit'}
              amount={isDeposit ? walletBalance : safeMaximumBorrow}
              tooltip={isDeposit ? '' : 'The maximum amount you can borrow without putting your health factor at risk'}
            />
          </Box>
          <Divider sx={{ borderColor: 'grey.200' }} />
          <Box px={2} py={1.5}>
            <Typography variant="cardTitle">Days to maturity</Typography>
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
