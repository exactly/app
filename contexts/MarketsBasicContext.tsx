import type { FC, PropsWithChildren } from 'react';
import React, { createContext, useContext, useState, useMemo, useCallback } from 'react';

import type { Operation } from 'types/Operation';
import useAnalytics from 'hooks/useAnalytics';
import { useOperationContext, DEFAULT_SLIPPAGE } from './OperationContext';

export type MarketsBasicOperation = 'borrow' | 'deposit';
export type MarketsBasicRewardRate = { assetSymbol: string; rate: bigint };
export type MarketsBasicOption = {
  maturity?: bigint;
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
  reset: () => void;
};

const MarketsBasicContext = createContext<ContextValues | null>(null);

export const MarketsBasicProvider: FC<PropsWithChildren> = ({ children }) => {
  const {
    list: { selectItem },
  } = useAnalytics();
  const {
    symbol,
    setDate,
    setOperation: setCtxOperation,
    setQty,
    setTx,
    setRequiresApproval,
    setGasCost,
    setIsLoading,
    setLoadingButton,
    setErrorData,
    setErrorButton,
    setRawSlippage,
  } = useOperationContext();
  const [operation, setOperation] = useState<MarketsBasicOperation>('deposit');
  const [selected, setSelected] = useState<MarketsBasicOption['maturity']>(0n);
  const onChangeOperation = useCallback(
    (op: MarketsBasicOperation) => {
      setCtxOperation(`${op}${selected && selected > 0 ? 'AtMaturity' : ''}` as Operation);
      setOperation(op);
    },
    [selected, setCtxOperation],
  );

  const setSelectedOption = useCallback(
    (option: MarketsBasicOption['maturity']) => {
      setSelected(option);
      setDate(BigInt(option || 0n));
      selectItem(BigInt(option || 0n));
    },
    [setDate, selectItem],
  );

  const reset = useCallback(() => {
    setQty('');
    setTx(undefined);
    setRequiresApproval(true);
    setGasCost(undefined);
    setIsLoading(false);

    setLoadingButton({});
    setErrorData(undefined);
    setErrorButton(undefined);
    setRawSlippage(DEFAULT_SLIPPAGE);
  }, [
    setErrorButton,
    setErrorData,
    setGasCost,
    setIsLoading,
    setLoadingButton,
    setQty,
    setRawSlippage,
    setRequiresApproval,
    setTx,
  ]);

  const value: ContextValues = useMemo(
    () => ({
      symbol,
      operation,
      onChangeOperation,
      selected,
      setSelected: setSelectedOption,
      reset,
    }),
    [symbol, operation, onChangeOperation, selected, setSelectedOption, reset],
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
