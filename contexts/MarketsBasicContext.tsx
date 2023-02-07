import React, { createContext, useContext, useState, useMemo, useCallback, useEffect } from 'react';
import type { FC, PropsWithChildren } from 'react';
import { MarketContext } from './MarketContext';

export type MarketsBasicOperation = 'borrow' | 'deposit';

type ContextValues = {
  symbol?: string;
  operation: MarketsBasicOperation;
  onChangeOperation: (op: MarketsBasicOperation) => void;
};

const MarketsBasicContext = createContext<ContextValues | null>(null);

export const MarketsBasicProvider: FC<PropsWithChildren> = ({ children }) => {
  const { marketSymbol: symbol, setMarketSymbol } = useContext(MarketContext);
  const [operation, setOperation] = useState<MarketsBasicOperation>('borrow');
  const onChangeOperation = useCallback((op: MarketsBasicOperation) => setOperation(op), [setOperation]);

  useEffect(() => setMarketSymbol('DAI'), [setMarketSymbol]);

  const value: ContextValues = useMemo(
    () => ({
      symbol,
      operation,
      onChangeOperation,
    }),
    [symbol, operation, onChangeOperation],
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
