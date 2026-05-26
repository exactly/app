import { useCallback } from 'react';
import numbers from 'config/numbers.json';
import { Operation } from 'types/Operation';
import { useModal } from 'contexts/ModalContext';
import { debtManagerAddress } from 'generated/wagmi';
import { defaultChain } from 'utils/client';
import useReadOnly from 'hooks/useReadOnly';
import { useConnection } from 'wagmi';
import useConnectWallet from 'hooks/useConnectWallet';

const { minAPRValue } = numbers;

const isDisable = (rateType: 'floating' | 'fixed', apr: number | undefined) => {
  if (rateType === 'floating') return false;
  if (!apr) return true;

  return apr < minAPRValue;
};

export default function useActionButton() {
  const { account: walletAddress } = useReadOnly();
  const connect = useConnectWallet();

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
  const { isImpersonating: impersonateActive } = useReadOnly();
  const { isConnected } = useConnection();
  const connect = useConnectWallet();
  const { open } = useModal('rollover');

  const startDebtManager = useCallback(
    (...args: Parameters<typeof open>) => {
      if (!isConnected && !impersonateActive) {
        return connect();
      }

      if (!(defaultChain.id in debtManagerAddress)) return;

      open(...args);
    },
    [isConnected, impersonateActive, open, connect],
  );

  const isRolloverDisabled = useCallback(
    (borrow?: bigint) => !(defaultChain.id in debtManagerAddress) || (borrow !== undefined && borrow === 0n),
    [],
  );

  return {
    startDebtManager,
    isRolloverDisabled,
  };
}

export function useStartLeverager() {
  const { isImpersonating: impersonateActive } = useReadOnly();
  const { isConnected } = useConnection();
  const connect = useConnectWallet();
  const { open } = useModal('leverager');

  const startLeverager = useCallback(() => {
    if (!isConnected && !impersonateActive) {
      return connect();
    }

    if (!(defaultChain.id in debtManagerAddress)) return;

    open();
  }, [isConnected, impersonateActive, open, connect]);

  const isLeveragerDisabled = useCallback(
    (borrow?: bigint) => !(defaultChain.id in debtManagerAddress) || (borrow !== undefined && borrow === 0n),
    [],
  );

  return {
    startLeverager,
    isLeveragerDisabled,
  };
}
