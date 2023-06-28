import React, {
  createContext,
  type PropsWithChildren,
  type FC,
  useContext,
  useState,
  useCallback,
  useReducer,
} from 'react';
import { useWalletClient } from 'wagmi';
import { waitForTransaction } from '@wagmi/core';

import type { ErrorData } from 'types/Error';
import type { PopulatedTransaction, Transaction } from 'types/Transaction';
import DebtManagerModal from 'components/DebtManager';
import type { Position } from 'components/DebtManager/types';
import useDebtManager from 'hooks/useDebtManager';
import numbers from 'config/numbers.json';
import useAccountData from 'hooks/useAccountData';
import useMarket from 'hooks/useMarket';
import { useWeb3 } from 'hooks/useWeb3';
import type { DebtManager, Market } from 'types/contracts';
import { GAS_LIMIT_MULTIPLIER, WEI_PER_ETHER } from 'utils/const';
import handleOperationError from 'utils/handleOperationError';
import useIsContract from 'hooks/useIsContract';
import useAnalytics from 'hooks/useAnalytics';

export type Input = {
  from?: Position;
  to?: Position;
  slippage: string;
  percent: number;
};

const DEFAULT_SLIPPAGE = (numbers.slippage * 100).toFixed(2);

const initState: Input = {
  from: undefined,
  to: undefined,
  slippage: DEFAULT_SLIPPAGE,
  percent: 100,
};

const reducer = (state: Input, action: Partial<Input>): Input => {
  return { ...state, ...action };
};

type ContextValues = {
  isOpen: boolean;
  openDebtManager: (from?: Position) => void;
  close: () => void;

  input: Input;
  setFrom: (from: Position) => void;
  setTo: (to: Position) => void;
  setPercent: (to: number) => void;
  setSlippage: (slippage: string) => void;

  debtManager?: DebtManager;
  market?: Market;

  errorData?: ErrorData;
  setErrorData: React.Dispatch<React.SetStateAction<ErrorData | undefined>>;
  tx?: Transaction;

  isLoading: boolean;

  needsApproval: (qty: bigint) => Promise<boolean>;
  approve: (maxAssets: bigint) => Promise<void>;
  submit: (populate: () => Promise<PopulatedTransaction | undefined>) => Promise<void>;
};

const DebtManagerContext = createContext<ContextValues | null>(null);

export const DebtManagerContextProvider: FC<PropsWithChildren> = ({ children }) => {
  const { transaction: track } = useAnalytics();
  const { walletAddress, opts } = useWeb3();
  const { data: walletClient } = useWalletClient();
  const { getMarketAccount, refreshAccountData } = useAccountData();
  const isContract = useIsContract();
  const [isOpen, setIsOpen] = useState(false);
  const [errorData, setErrorData] = useState<ErrorData | undefined>();

  const [input, dispatch] = useReducer(reducer, initState);

  const [tx, setTx] = useState<Transaction | undefined>();
  const [isLoading, setIsLoading] = useState(false);

  const setFrom = useCallback((from: Position) => dispatch({ ...initState, from }), []);
  const setTo = useCallback((to: Position) => dispatch({ to }), []);
  const setPercent = useCallback((percent: number) => dispatch({ percent }), []);
  const setSlippage = useCallback((slippage: string) => dispatch({ slippage }), []);

  const openDebtManager = useCallback((from?: Position) => {
    dispatch({ ...initState, from });
    setTx(undefined);
    setIsLoading(false);
    setIsOpen(true);
  }, []);

  const close = useCallback(() => setIsOpen(false), []);

  const debtManager = useDebtManager();

  const market = useMarket(input.from && getMarketAccount(input.from.symbol)?.market);

  const needsApproval = useCallback(
    async (qty: bigint): Promise<boolean> => {
      if (!walletAddress || !market || !debtManager || !opts || qty === 0n) return true;
      try {
        if (!(await isContract(walletAddress))) return false;
        const allowance = await market.read.allowance([walletAddress, debtManager.address], opts);
        return allowance <= qty;
      } catch (e: unknown) {
        setErrorData({ status: true, message: handleOperationError(e) });
        return true;
      }
    },
    [walletAddress, market, debtManager, isContract, opts],
  );

  const approve = useCallback(
    async (maxAssets: bigint) => {
      if (!debtManager || !market || !opts) return;

      setIsLoading(true);
      try {
        const max = (maxAssets * 100_005n) / 100_000n;
        const gasEstimation = await market.estimateGas.approve([debtManager.address, max], opts);
        const hash = await market.write.approve([debtManager.address, max], {
          ...opts,
          gas: (gasEstimation * GAS_LIMIT_MULTIPLIER) / WEI_PER_ETHER,
        });
        await waitForTransaction({ hash });
      } catch (e: unknown) {
        setErrorData({ status: true, message: handleOperationError(e) });
      } finally {
        setIsLoading(false);
      }
    },
    [debtManager, market, opts],
  );

  const submit = useCallback(
    async (populate: () => Promise<PopulatedTransaction | undefined>): Promise<void> => {
      if (!walletClient || !market || !debtManager) return;

      setIsLoading(true);
      try {
        track.addToCart('roll', input);
        const transaction = await populate();
        if (!transaction) return;
        const hash = await walletClient.writeContract(transaction);
        track.beginCheckout('roll', input);
        setTx({ status: 'processing', hash });
        const { status, transactionHash } = await waitForTransaction({ hash });
        setTx({ status: status ? 'success' : 'error', hash: transactionHash });

        if (status) track.purchase('roll', input);

        await refreshAccountData();
      } catch (e: unknown) {
        track.removeFromCart('roll', input);
        setErrorData({ status: true, message: handleOperationError(e) });
      } finally {
        setIsLoading(false);
      }
    },
    [walletClient, market, debtManager, track, input, refreshAccountData],
  );

  const value: ContextValues = {
    isOpen,
    openDebtManager,
    close,

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

  return (
    <DebtManagerContext.Provider value={value}>
      {children}
      <DebtManagerModal />
    </DebtManagerContext.Provider>
  );
};

export function useDebtManagerContext() {
  const ctx = useContext(DebtManagerContext);
  if (!ctx) {
    throw new Error('Using DebtManagerContext outside of provider');
  }
  return ctx;
}

export default DebtManagerContext;
