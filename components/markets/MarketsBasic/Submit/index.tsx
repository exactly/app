import React, { FC, useMemo } from 'react';
import ModalSubmit from 'components/OperationsModal/ModalSubmit';
import Loading from 'components/markets/MarketsBasic/Loading';
import { MarketsBasicOperation, MarketsBasicOption, useMarketsBasic } from 'contexts/MarketsBasicContext';
import type { Operation } from 'types/Operation';
import useBorrow from 'hooks/useBorrow';
import useBorrowAtMaturity from 'hooks/useBorrowAtMaturity';
import useDeposit from 'hooks/useDeposit';
import useDepositAtMaturity from 'hooks/useDepositAtMaturity';
import { ErrorData } from 'types/Error';
import daysLeft from 'utils/daysLeft';
import formatNumber from 'utils/formatNumber';
import useAccountData from 'hooks/useAccountData';
import { useTranslation } from 'react-i18next';
import useTranslateOperation from 'hooks/useTranslateOperation';
import formatSymbol from 'utils/formatSymbol';

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
};

const Submit: FC<SubmitProps> = ({ symbol, operation, option, qty, errorData }) => {
  const { t } = useTranslation();
  const translateOperation = useTranslateOperation();
  const { marketAccount } = useAccountData(symbol);
  const { reset } = useMarketsBasic();
  const deposit = useDeposit();
  const depositAtMaturity = useDepositAtMaturity();
  const borrow = useBorrow();
  const borrowAtMaturity = useBorrowAtMaturity();

  const selected = useMemo(() => {
    const op = getOperation(operation, option.maturity === 0n);
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

  const submitLabel = useMemo(() => {
    const parsed = parseFloat(qty);
    const amount = parsed ? (Number.isInteger(parsed) ? parsed : formatNumber(qty, symbol)) : '';

    return `${translateOperation(operation, { capitalize: true })} ${amount} ${formatSymbol(symbol)}${
      !selected.isFloating && option.maturity ? t(' for {{daysLeft}}', { daysLeft: daysLeft(option.maturity) }) : ''
    }`;
  }, [selected.isFloating, operation, option.maturity, qty, symbol, t, translateOperation]);

  return (
    <>
      <ModalSubmit
        label={submitLabel}
        symbol={symbol === 'WETH' && marketAccount ? marketAccount.symbol : symbol}
        submit={selected.handleSubmitAction}
        isLoading={selected.isLoading || selected.isPreparing}
        disabled={
          !qty ||
          parseFloat(qty) <= 0 ||
          selected.isLoading ||
          selected.isPreparing ||
          errorData?.status ||
          symbol === 'USDC.e'
        }
        refreshOnSubmit={false}
      />
      {selected.txStatus && (
        <Loading
          isOpen={Boolean(selected.txStatus)}
          tx={{ status: selected.txStatus, hash: selected.txHash }}
          close={reset}
        />
      )}
    </>
  );
};

export default React.memo(Submit);
