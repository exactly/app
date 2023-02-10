import ModalSubmit from 'components/common/modal/ModalSubmit';
import { MarketContext } from 'contexts/MarketContext';
import { MarketsBasicOperation, MarketsBasicOption } from 'contexts/MarketsBasicContext';
import useBorrow from 'hooks/useBorrow';
import useBorrowAtMaturity from 'hooks/useBorrowAtMaturity';
import useDeposit from 'hooks/useDeposit';
import useDepositAtMaturity from 'hooks/useDepositAtMaturity';
import React, { FC, useContext, useEffect, useMemo } from 'react';
import { ErrorData } from 'types/Error';

type SubmitProps = {
  symbol: string;
  operation: MarketsBasicOperation;
  option: MarketsBasicOption;
  qty: string;
  errorData?: ErrorData;
  requiresApproval: boolean;
};

const Submit: FC<SubmitProps> = ({ symbol, operation, option, qty, errorData, requiresApproval }) => {
  const { setDate } = useContext(MarketContext);
  const { handleSubmitAction: deposit, isLoading: isLoadingDeposit } = useDeposit();
  const { handleSubmitAction: depositAtMaturity, isLoading: isLoadingDepositAtMaturity } = useDepositAtMaturity();
  const { handleSubmitAction: borrow, isLoading: isLoadingBorrow } = useBorrow();
  const { handleSubmitAction: borrowAtMaturity, isLoading: isLoadingBorrowAtMaturity } = useBorrowAtMaturity();

  const isFloating = useMemo(() => option.maturity === 0, [option.maturity]);

  const isLoading = useMemo(() => {
    if (operation === 'deposit') {
      return isFloating ? isLoadingDeposit : isLoadingDepositAtMaturity;
    }
    return isFloating ? isLoadingBorrow : isLoadingBorrowAtMaturity;
  }, [operation, isFloating, isLoadingBorrow, isLoadingBorrowAtMaturity, isLoadingDeposit, isLoadingDepositAtMaturity]);

  const handleSubmitAction = useMemo(() => {
    if (operation === 'deposit') {
      return isFloating ? deposit : depositAtMaturity;
    }
    return isFloating ? borrow : borrowAtMaturity;
  }, [operation, isFloating, borrow, borrowAtMaturity, deposit, depositAtMaturity]);

  useEffect(() => setDate(option.maturity || 0), [setDate, option.maturity]);

  return (
    <ModalSubmit
      label={`${operation === 'deposit' ? 'Deposit' : 'Borrow'} ${symbol} (${isFloating ? 'variable' : 'fixed'} rate)`}
      symbol={symbol}
      submit={handleSubmitAction}
      isLoading={isLoading}
      disabled={!qty || parseFloat(qty) <= 0 || isLoading || errorData?.status}
      requiresApproval={requiresApproval}
    />
  );
};

export default Submit;
