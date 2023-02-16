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

  const isDeposit = useMemo(() => operation === 'deposit', [operation]);

  const allOptions: MarketsBasicOption[] = useMemo(
    () => [
      { maturity: 0, depositAPR: floatingDepositAPR, borrowAPR: floatingBorrowAPR },
      ...fixedOptions.map(({ maturity, depositAPR, borrowAPR }) => ({ maturity, depositAPR, borrowAPR })),
    ],
    [fixedOptions, floatingBorrowAPR, floatingDepositAPR],
  );

  const bestOption = useMemo(() => {
    const options = allOptions
      .map(({ maturity, depositAPR, borrowAPR }) => ({
        maturity,
        apr: isDeposit ? depositAPR : borrowAPR,
      }))
      .map((option) => ({ ...option, apr: parseFloat((option.apr || 0).toFixed(4)) }));

    const bestDepositOption = options.reduce((acc, option) => (option.apr >= acc.apr ? option : acc), {
      maturity: 0,
      apr: 0,
    }).maturity;

    const bestBorrowOption = options.reduce(
      (acc, option) => ((option.apr || Infinity) <= (acc.apr || Infinity) ? option : acc),
      { maturity: 0, apr: Infinity },
    ).maturity;

    return isDeposit ? bestDepositOption : bestBorrowOption;
  }, [allOptions, isDeposit]);

  const currentOption = useMemo(
    () => allOptions.find((option) => option.maturity === selected),
    [allOptions, selected],
  );

  useEffect(() => setSelected(bestOption), [bestOption, setSelected]);

  useEffect(() => {
    if (tx) openOperationModal(`${operation}${currentOption?.maturity ? 'AtMaturity' : ''}`);
  }, [currentOption?.maturity, openOperationModal, operation, tx]);

  return (
    <Box display="flex" flexDirection="column" gap={2}>
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
              label={isDeposit ? 'Wallet balance' : 'Borrow limit'}
              amount={isDeposit ? walletBalance : safeMaximumBorrow}
            />
          </Box>
          <Divider sx={{ background: 'figma.grey.700' }} />
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

        {errorData?.status && <ModalAlert variant="error" message={errorData.message} />}

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
