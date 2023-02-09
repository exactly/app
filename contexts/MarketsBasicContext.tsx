import React, { createContext, useContext, useState, useMemo, useCallback, useEffect } from 'react';
import type { FC, PropsWithChildren } from 'react';
import { MarketContext } from './MarketContext';
import { BigNumber } from '@ethersproject/bignumber';

export type MarketsBasicOperation = 'borrow' | 'deposit';
export type MarketsBasicOption = {
  maturity?: number;
  depositAPR?: number;
  borrowAPR?: number;
  optimalDeposit?: BigNumber;
  slippageAPR?: string;
};

type ContextValues = {
  symbol?: string;
  operation: MarketsBasicOperation;
  onChangeOperation: (op: MarketsBasicOperation) => void;
  selected?: MarketsBasicOption['maturity'];
  setSelected: (option: MarketsBasicOption['maturity']) => void;
};

const MarketsBasicContext = createContext<ContextValues | null>(null);

export const MarketsBasicProvider: FC<PropsWithChildren> = ({ children }) => {
  const { marketSymbol: symbol, setMarketSymbol } = useContext(MarketContext);
  const [operation, setOperation] = useState<MarketsBasicOperation>('deposit');
  const [selected, setSelected] = useState<MarketsBasicOption['maturity']>(0);
  const onChangeOperation = useCallback((op: MarketsBasicOperation) => setOperation(op), [setOperation]);

  useEffect(() => setMarketSymbol('DAI'), [setMarketSymbol]);

  const value: ContextValues = useMemo(
    () => ({
      symbol,
      operation,
      onChangeOperation,
      selected,
      setSelected,
    }),
    [symbol, operation, onChangeOperation, selected, setSelected],
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
