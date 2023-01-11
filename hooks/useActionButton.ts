import { useCallback, useContext } from 'react';
import { useWeb3Modal } from '@web3modal/react';
import { useWeb3 } from 'hooks/useWeb3';
import { MarketContext } from 'contexts/MarketContext';
import { Operation, useModalStatus } from 'contexts/ModalStatusContext';
import numbers from 'config/numbers.json';

const { minAPRValue } = numbers;

export default function useActionButton() {
  const { open } = useWeb3Modal();
  const { walletAddress } = useWeb3();
  const { setDate, setMarketSymbol } = useContext(MarketContext);
  const { openOperationModal } = useModalStatus();

  const handleActionClick = useCallback(
    (e: React.MouseEvent<HTMLButtonElement, MouseEvent>, action: Operation, symbol: string, maturity?: number) => {
      e.preventDefault();

      if (!walletAddress) return open({ route: 'ConnectWallet' });

      setMarketSymbol(symbol);

      if (maturity) {
        setDate(maturity);
      }

      openOperationModal(action);
    },
    [open, openOperationModal, setDate, setMarketSymbol, walletAddress],
  );

  const isDisable = (rateType: 'floating' | 'fixed', apr: number | undefined) => {
    if (rateType === 'floating') return false;
    if (!apr) return true;

    return apr < minAPRValue;
  };

  return { handleActionClick, isDisable };
}
