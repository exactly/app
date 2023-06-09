import type { FC, PropsWithChildren } from 'react';
import React, { createContext, useContext, useState, useMemo, useCallback } from 'react';

import { Operation, useModalStatus } from './ModalStatusContext';
import { useMarketContext } from './MarketContext';
import useAnalytics from 'hooks/useAnalytics';

export type MarketsBasicOperation = 'borrow' | 'deposit';
export type MarketsBasicRewardRate = { assetSymbol: string; rate: bigint };
export type MarketsBasicOption = {
  maturity?: number;
  depositAPR?: number;
  borrowAPR?: number;
  depositRewards?: MarketsBasicRewardRate[];
  borrowRewards?: MarketsBasicRewardRate[];
  interest?: bigint;
  finalAssets?: bigint;
};

type ContextValues = {
  symbol: string;
  operation: MarketsBasicOperation;
  onChangeOperation: (op: MarketsBasicOperation) => void;
  selected?: MarketsBasicOption['maturity'];
  setSelected: (option: MarketsBasicOption['maturity']) => void;
};

const MarketsBasicContext = createContext<ContextValues | null>(null);

export const MarketsBasicProvider: FC<PropsWithChildren> = ({ children }) => {
  const {
    list: { selectItem },
  } = useAnalytics();
  const { setOperation: setModalOperation } = useModalStatus();
  const { marketSymbol: symbol, setDate } = useMarketContext();
  const [operation, setOperation] = useState<MarketsBasicOperation>('deposit');
  const [selected, setSelected] = useState<MarketsBasicOption['maturity']>(0);
  const onChangeOperation = useCallback(
    (op: MarketsBasicOperation) => {
      setModalOperation(`${op}${selected && selected > 0 ? 'AtMaturity' : ''}` as Operation);
      setOperation(op);
    },
    [selected, setModalOperation],
  );

  const setSelectedOption = useCallback(
    (option: MarketsBasicOption['maturity']) => {
      setSelected(option);
      setDate(option || 0);
      selectItem(option || 0);
    },
    [setDate, selectItem],
  );

  const value: ContextValues = useMemo(
    () => ({
      symbol,
      operation,
      onChangeOperation,
      selected,
      setSelected: setSelectedOption,
    }),
    [symbol, operation, onChangeOperation, selected, setSelectedOption],
  );

  return <MarketsBasicContext.Provider value={value}>{children}</MarketsBasicContext.Provider>;
};

export function useMarketsBasic() {
  const ctx = useContext(MarketsBasicContext);
  if (!ctx) {
    throw new Error('Using MarketsBasicContext outside of provider');
  }
  return ctx;
}

export default MarketsBasicContext;
