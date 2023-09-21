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
import type { Position } from 'components/DebtManager/types';
import useDebtManager from 'hooks/useDebtManager';
import useAccountData from 'hooks/useAccountData';
import useMarket from 'hooks/useMarket';
import { useWeb3 } from 'hooks/useWeb3';
import type { DebtManager, Market } from 'types/contracts';
import handleOperationError from 'utils/handleOperationError';
import useIsContract from 'hooks/useIsContract';
import useAnalytics from 'hooks/useAnalytics';
import { gasLimit } from 'utils/gas';
import { Args } from './ModalContext';

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

type Props = {
  args: Args<'rollover'>;
};

export const DebtManagerContextProvider: FC<PropsWithChildren<Props>> = ({ args, children }) => {
  const { transaction: track } = useAnalytics();
  const { walletAddress, opts } = useWeb3();
  const { data: walletClient } = useWalletClient();
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
      if (!walletAddress || !market || !debtManager || !opts || qty === 0n) return true;
      try {
        const isMultiSig = await isContract(walletAddress);
        if (!isMultiSig) return false;

        const shares = await market.read.previewWithdraw([qty], opts);
        const allowance = await market.read.allowance([walletAddress, debtManager.address], opts);
        return allowance < shares;
      } catch (e: unknown) {
        setErrorData({ status: true, message: handleOperationError(e) });
        return true;
      }
    },
    [walletAddress, market, debtManager, isContract, opts],
  );

  const approve = useCallback(
    async (assets: bigint) => {
      if (!debtManager || !market || !opts) return;

      setIsLoading(true);
      try {
        const max = await market.read.previewWithdraw([(assets * 100_005n) / 100_000n], opts);
        const gasEstimation = await market.estimateGas.approve([debtManager.address, max], opts);
        const hash = await market.write.approve([debtManager.address, max], {
          ...opts,
          gasLimit: gasLimit(gasEstimation),
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
      if (!walletClient) return;

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
    [walletClient, track, input, refreshAccountData],
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
