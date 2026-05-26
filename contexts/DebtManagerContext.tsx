import React, {
  createContext,
  type PropsWithChildren,
  type FC,
  useContext,
  useState,
  useCallback,
  useReducer,
} from 'react';
import type { Hex } from 'viem';
import waitForTransaction from 'utils/waitForTransaction';

import type { ErrorData } from 'types/Error';
import type { Transaction } from 'types/Transaction';
import type { Position } from 'components/DebtManager/types';
import useDebtManager from 'hooks/useDebtManager';
import useAccountData from 'hooks/useAccountData';
import useMarket from 'hooks/useMarket';
import type { Market } from 'types/contracts';
import handleOperationError from 'utils/handleOperationError';
import useIsContract from 'hooks/useIsContract';
import { gasLimit } from 'utils/gas';
import { Args } from './ModalContext';
import useReadOnly from 'hooks/useReadOnly';
import { defaultChain } from 'utils/client';

export type RolloverInput = {
  from?: Position;
  to?: Position;
  slippage: string;
  percent: number;
};

export function isRolloverInput(input: unknown): input is RolloverInput {
  return (
    typeof input === 'object' &&
    input !== null &&
    'from' in input &&
    'to' in input &&
    'slippage' in input &&
    'percent' in input
  );
}

const DEFAULT_SLIPPAGE = '0.01';

const initState: RolloverInput = {
  from: undefined,
  to: undefined,
  slippage: DEFAULT_SLIPPAGE,
  percent: 100,
};

const reducer = (state: RolloverInput, action: Partial<RolloverInput>): RolloverInput => {
  return { ...state, ...action };
};

type ContextValues = {
  input: RolloverInput;
  setFrom: (from: Position) => void;
  setTo: (to: Position) => void;
  setPercent: (to: number) => void;
  setSlippage: (slippage: string) => void;

  debtManager?: ReturnType<typeof useDebtManager>;
  market?: Market;

  errorData?: ErrorData;
  setErrorData: React.Dispatch<React.SetStateAction<ErrorData | undefined>>;
  tx?: Transaction;

  isLoading: boolean;

  needsApproval: (qty: bigint) => Promise<boolean>;
  approve: (maxAssets: bigint) => Promise<void>;
  submit: (execute: () => Promise<Hex | undefined>) => Promise<void>;
};

const DebtManagerContext = createContext<ContextValues | null>(null);

type Props = {
  args: Args<'rollover'>;
};

export const DebtManagerContextProvider: FC<PropsWithChildren<Props>> = ({ args, children }) => {
  const { account: walletAddress } = useReadOnly();
  const { getMarketAccount, refreshAccountData } = useAccountData();
  const isContract = useIsContract();
  const [errorData, setErrorData] = useState<ErrorData | undefined>();

  const [input, dispatch] = useReducer(reducer, { ...initState, ...args });

  const [tx, setTx] = useState<Transaction | undefined>();
  const [isLoading, setIsLoading] = useState(false);

  const setFrom = useCallback((from: Position) => dispatch({ ...initState, from }), []);
  const setTo = useCallback((to: Position) => dispatch({ to }), []);
  const setPercent = useCallback((percent: number) => dispatch({ percent }), []);
  const setSlippage = useCallback((slippage: string) => dispatch({ slippage }), []);

  const debtManager = useDebtManager();

  const market = useMarket(input.from && getMarketAccount(input.from.symbol)?.market);

  const needsApproval = useCallback(
    async (qty: bigint): Promise<boolean> => {
      if (!walletAddress || !market || !debtManager || !walletAddress || qty === 0n) return true;
      try {
        const isMultiSig = await isContract(walletAddress);
        if (!isMultiSig) return false;

        const shares = await market.read.previewWithdraw([qty], { account: walletAddress });
        const allowance = await market.read.allowance([walletAddress, debtManager.address], {
          account: walletAddress,
        });
        return allowance < shares;
      } catch (e: unknown) {
        setErrorData({ status: true, message: handleOperationError(e) });
        return true;
      }
    },
    [walletAddress, market, debtManager, isContract],
  );

  const approve = useCallback(
    async (assets: bigint) => {
      if (!debtManager || !market || !walletAddress) return;

      setIsLoading(true);
      try {
        const max = await market.read.previewWithdraw([(assets * 100_005n) / 100_000n], {
          account: walletAddress,
        });
        const gasEstimation = await market.estimateGas.approve([debtManager.address, max], {
          account: walletAddress,
        });
        const hash = await market.write.approve([debtManager.address, max], {
          account: walletAddress,
          chain: defaultChain,
          gas: gasLimit(gasEstimation),
        });
        await waitForTransaction({ hash });
      } catch (e: unknown) {
        setErrorData({ status: true, message: handleOperationError(e) });
      } finally {
        setIsLoading(false);
      }
    },
    [debtManager, market, walletAddress],
  );

  const submit = useCallback(
    async (execute: () => Promise<Hex | undefined>): Promise<void> => {
      setIsLoading(true);
      try {
        const hash = await execute();
        if (!hash) return;
        setTx({ status: 'processing', hash });
        const { status, transactionHash } = await waitForTransaction({ hash });
        setTx({ status: status ? 'success' : 'error', hash: transactionHash });

        await refreshAccountData();
      } catch (e: unknown) {
        setErrorData({ status: true, message: handleOperationError(e) });
      } finally {
        setIsLoading(false);
      }
    },
    [refreshAccountData],
  );

  const value: ContextValues = {
    input,
    setFrom,
    setTo,
    setPercent,
    setSlippage,

    debtManager,
    market,

    errorData,
    setErrorData,
    tx,
    isLoading,

    needsApproval,
    approve,
    submit,
  };

  return <DebtManagerContext.Provider value={value}>{children}</DebtManagerContext.Provider>;
};

export function useDebtManagerContext() {
  const ctx = useContext(DebtManagerContext);
  if (!ctx) {
    throw new Error('Using DebtManagerContext outside of provider');
  }
  return ctx;
}

export default DebtManagerContext;
