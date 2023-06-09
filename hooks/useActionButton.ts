import { useCallback } from 'react';
import { useWeb3 } from 'hooks/useWeb3';
import { Operation, useModalStatus } from 'contexts/ModalStatusContext';
import numbers from 'config/numbers.json';
import { useMarketContext } from 'contexts/MarketContext';
import { useDebtManagerContext } from 'contexts/DebtManagerContext';

const { minAPRValue } = numbers;

const isDisable = (rateType: 'floating' | 'fixed', apr: number | undefined) => {
  if (rateType === 'floating') return false;
  if (!apr) return true;

  return apr < minAPRValue;
};

export default function useActionButton() {
  const { walletAddress, connect } = useWeb3();
  const { setDate, setMarketSymbol } = useMarketContext();
  const { openOperationModal } = useModalStatus();

  const handleActionClick = useCallback(
    (e: React.MouseEvent<HTMLButtonElement, MouseEvent>, action: Operation, symbol: string, maturity?: number) => {
      e.preventDefault();

      if (!walletAddress) return connect();

      setMarketSymbol(symbol);

      if (maturity) {
        setDate(maturity);
      }

      openOperationModal(action);
    },
    [walletAddress, connect, setMarketSymbol, openOperationModal, setDate],
  );

  return { handleActionClick, isDisable };
}

export function useStartDebtManagerButton() {
  const { connect, isConnected } = useWeb3();
  const { openDebtManager, debtManager } = useDebtManagerContext();

  const startDebtManager = useCallback(
    (...args: Parameters<typeof openDebtManager>) => {
      if (!isConnected) {
        return connect();
      }

      if (!debtManager) return;

      openDebtManager(...args);
    },
    [debtManager, connect, isConnected, openDebtManager],
  );

  const isRolloverDisabled = useCallback(
    (borrow?: bigint) => !debtManager || (borrow !== undefined && borrow === 0n),
    [debtManager],
  );

  return {
    startDebtManager,
    isRolloverDisabled,
  };
}
