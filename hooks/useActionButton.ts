import { useCallback } from 'react';
import { useWeb3 } from 'hooks/useWeb3';
import numbers from 'config/numbers.json';
import useDebtManager from './useDebtManager';
import { Operation } from 'types/Operation';
import { useModal } from 'contexts/ModalContext';

const { minAPRValue } = numbers;

const isDisable = (rateType: 'floating' | 'fixed', apr: number | undefined) => {
  if (rateType === 'floating') return false;
  if (!apr) return true;

  return apr < minAPRValue;
};

export default function useActionButton() {
  const { walletAddress, connect } = useWeb3();

  const { open } = useModal('operation');

  const handleActionClick = useCallback(
    (e: React.MouseEvent<HTMLButtonElement, MouseEvent>, action: Operation, symbol: string, maturity?: bigint) => {
      e.preventDefault();

      if (!walletAddress) return connect();

      open({ operation: action, symbol, maturity });
    },
    [walletAddress, connect, open],
  );

  return { handleActionClick, isDisable };
}

export function useStartDebtManagerButton() {
  const { connect, isConnected, impersonateActive } = useWeb3();
  const debtManager = useDebtManager();
  const { open } = useModal('rollover');

  const startDebtManager = useCallback(
    (...args: Parameters<typeof open>) => {
      if (!isConnected && !impersonateActive) {
        return connect();
      }

      if (!debtManager) return;

      open(...args);
    },
    [isConnected, impersonateActive, debtManager, open, connect],
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

export function useStartLeverager() {
  const { connect, isConnected, impersonateActive } = useWeb3();
  const debtManager = useDebtManager();
  const { open } = useModal('leverager');

  const startLeverager = useCallback(() => {
    if (!isConnected && !impersonateActive) {
      return connect();
    }

    if (!debtManager) return;

    open();
  }, [isConnected, impersonateActive, debtManager, open, connect]);

  const isLeveragerDisabled = useCallback(
    (borrow?: bigint) => !debtManager || (borrow !== undefined && borrow === 0n),
    [debtManager],
  );

  return {
    startLeverager,
    isLeveragerDisabled,
  };
}
