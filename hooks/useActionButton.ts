import { useCallback } from 'react';
import { useWeb3 } from 'hooks/useWeb3';
import { Operation, useModalStatus } from 'contexts/ModalStatusContext';
import numbers from 'config/numbers.json';
import { useMarketContext } from 'contexts/MarketContext';

const { minAPRValue } = numbers;

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

  const isDisable = (rateType: 'floating' | 'fixed', apr: number | undefined) => {
    if (rateType === 'floating') return false;
    if (!apr) return true;

    return apr < minAPRValue;
  };

  return { handleActionClick, isDisable };
}
