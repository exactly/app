import { useCallback, useContext } from 'react';
import AccountDataContext from 'contexts/AccountDataContext';
import { useWeb3 } from 'hooks/useWeb3';
import { MarketContext } from 'contexts/MarketContext';
import { Operation, useModalStatus } from 'contexts/ModalStatusContext';
import parseTimestamp from 'utils/parseTimestamp';
import numbers from 'config/numbers.json';

const { minAPRValue } = numbers;

export default function useMarketsPools() {
  const { walletAddress, connect } = useWeb3();
  const { accountData } = useContext(AccountDataContext);
  const { setDate, setMarket } = useContext(MarketContext);
  const { openOperationModal } = useModalStatus();

  const handleActionClick = useCallback(
    (
      e: React.MouseEvent<HTMLButtonElement, MouseEvent>,
      action: Extract<Operation, 'borrow' | 'deposit' | 'depositAtMaturity' | 'borrowAtMaturity'>,
      symbol: string,
      maturity?: number,
    ) => {
      e.preventDefault();

      if (!walletAddress && connect) return connect();

      if (!accountData) return;

      const { market } = accountData[symbol];

      setMarket({ value: market });

      if (maturity) {
        setDate({
          value: maturity.toString(),
          label: parseTimestamp(maturity),
        });
      }

      openOperationModal(action);
    },
    [accountData, connect, openOperationModal, setDate, setMarket, walletAddress],
  );

  const isDisable = (rateType: 'floating' | 'fixed', apr: number | undefined) => {
    if (rateType === 'floating') return false;
    if (!apr) return true;

    return apr < minAPRValue;
  };

  return { handleActionClick, isDisable };
}
