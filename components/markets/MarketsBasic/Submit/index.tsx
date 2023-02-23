import React, { FC, useContext, useEffect, useMemo } from 'react';
import ModalSubmit from 'components/common/modal/ModalSubmit';
import { MarketContext } from 'contexts/MarketContext';
import { MarketsBasicOperation, MarketsBasicOption } from 'contexts/MarketsBasicContext';
import { Operation } from 'contexts/ModalStatusContext';
import { usePreviewTx } from 'contexts/OperationContext';
import useBorrow from 'hooks/useBorrow';
import useBorrowAtMaturity from 'hooks/useBorrowAtMaturity';
import useDeposit from 'hooks/useDeposit';
import useDepositAtMaturity from 'hooks/useDepositAtMaturity';
import { ErrorData } from 'types/Error';
import { useWeb3 } from 'hooks/useWeb3';
import { useWeb3Modal } from '@web3modal/react';
import { Button } from '@mui/material';
import daysLeft from 'utils/daysLeft';
import formatNumber from 'utils/formatNumber';

const getOperation = (
  op: MarketsBasicOperation,
  isFloating: boolean,
): Extract<Operation, 'borrow' | 'borrowAtMaturity' | 'deposit' | 'depositAtMaturity'> => {
  switch (op) {
    case 'borrow':
      return isFloating ? 'borrow' : 'borrowAtMaturity';
    case 'deposit':
      return isFloating ? 'deposit' : 'depositAtMaturity';
  }
};

type SubmitProps = {
  symbol: string;
  operation: MarketsBasicOperation;
  option: MarketsBasicOption;
  qty: string;
  errorData?: ErrorData;
  requiresApproval: boolean;
};

const Submit: FC<SubmitProps> = ({ symbol, operation, option, qty, errorData, requiresApproval }) => {
  const { walletAddress } = useWeb3();
  const { setDate } = useContext(MarketContext);
  const deposit = useDeposit();
  const depositAtMaturity = useDepositAtMaturity();
  const borrow = useBorrow();
  const borrowAtMaturity = useBorrowAtMaturity();

  const { isLoading, handleSubmitAction, needsApproval, previewGasCost, isFloating } = useMemo(() => {
    const op = getOperation(operation, option.maturity === 0);
    switch (op) {
      case 'borrow':
        return {
          ...borrow,
          isFloating: true,
        };
      case 'borrowAtMaturity':
        return {
          ...borrowAtMaturity,
          isFloating: false,
        };

      case 'deposit':
        return {
          ...deposit,
          isFloating: true,
        };
      case 'depositAtMaturity':
        return {
          ...depositAtMaturity,
          isFloating: false,
        };
    }
  }, [borrow, borrowAtMaturity, deposit, depositAtMaturity, operation, option.maturity]);

  useEffect(() => setDate(option.maturity || 0), [setDate, option.maturity]);

  const { isLoading: previewIsLoading } = usePreviewTx({ qty, needsApproval, previewGasCost });

  const { open } = useWeb3Modal();

  const submitLabel = useMemo(
    () =>
      `${operation === 'deposit' ? 'Deposit' : 'Borrow'} ${
        parseFloat(qty) ? formatNumber(qty, symbol) : ''
      } ${symbol} ${!isFloating && option.maturity ? `for ${daysLeft(option.maturity)}` : ''}`,
    [isFloating, operation, option.maturity, qty, symbol],
  );

  if (!walletAddress) {
    return (
      <Button sx={{ width: '100%' }} onClick={() => open({ route: 'ConnectWallet' })} variant="contained">
        Connect wallet
      </Button>
    );
  }

  return (
    <ModalSubmit
      label={submitLabel}
      symbol={symbol}
      submit={handleSubmitAction}
      isLoading={isLoading || previewIsLoading}
      disabled={!qty || parseFloat(qty) <= 0 || isLoading || previewIsLoading || errorData?.status}
      requiresApproval={requiresApproval}
    />
  );
};

export default React.memo(Submit);
