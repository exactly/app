import React, {
  createContext,
  type PropsWithChildren,
  type FC,
  useContext,
  useState,
  useCallback,
  useEffect,
  useReducer,
} from 'react';
import { erc20Abi, type Address, type Hex } from 'viem';
import { useSendCalls, useWaitForCallsStatus, usePublicClient } from 'wagmi';

import type { ErrorData } from 'types/Error';
import type { Transaction } from 'types/Transaction';
import type { Position } from 'components/DebtManager/types';
import usePreviewerExactly from 'hooks/usePreviewerExactly';
import { useQueryClient } from '@tanstack/react-query';
import { getContractEventsQueryKey } from '@wagmi/core/query';
import { debtManagerAddress, marketAbi } from 'generated/wagmi';
import handleOperationError from 'utils/handleOperationError';
import useIsContract from 'hooks/useIsContract';
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

  debtManager?: Address;

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
  const { data, refetch } = usePreviewerExactly();
  const queryClient = useQueryClient();
  const isContract = useIsContract();
  const publicClient = usePublicClient();
  const { mutateAsync: sendCalls, isPending: sendCallsPending } = useSendCalls();
  const [approveCallId, setApproveCallId] = useState<string>();
  const { data: approveStatus, isLoading: approveWaiting } = useWaitForCallsStatus({
    id: approveCallId,
    query: { enabled: Boolean(approveCallId) },
  });
  const [submitting, setSubmitting] = useState(false);
  const [errorData, setErrorData] = useState<ErrorData | undefined>();

  const [input, dispatch] = useReducer(reducer, { ...initState, ...args });

  const [tx, setTx] = useState<Transaction | undefined>();

  const setFrom = useCallback((from: Position) => dispatch({ ...initState, from }), []);
  const setTo = useCallback((to: Position) => dispatch({ to }), []);
  const setPercent = useCallback((percent: number) => dispatch({ percent }), []);
  const setSlippage = useCallback((slippage: string) => dispatch({ slippage }), []);

  const debtManager = Object.entries(debtManagerAddress).find(([chainId]) => Number(chainId) === defaultChain.id)?.[1];

  const market = input.from && data?.find((m) => m.assetSymbol === input.from?.symbol)?.market;

  useEffect(() => {
    if (approveStatus?.status === 'success' || approveStatus?.status === 'failure') setApproveCallId(undefined);
  }, [approveStatus?.status]);

  const needsApproval = useCallback(
    async (qty: bigint): Promise<boolean> => {
      if (!walletAddress || !market || !debtManager || !publicClient || qty === 0n) return true;
      try {
        const isMultiSig = await isContract(walletAddress);
        if (!isMultiSig) return false;

        const [shares, allowance] = await Promise.all([
          publicClient.readContract({
            address: market,
            abi: marketAbi,
            functionName: 'previewWithdraw',
            args: [qty],
            account: walletAddress,
          }),
          publicClient.readContract({
            address: market,
            abi: erc20Abi,
            functionName: 'allowance',
            args: [walletAddress, debtManager],
            account: walletAddress,
          }),
        ]);
        return allowance < shares;
      } catch (e: unknown) {
        setErrorData({ status: true, message: handleOperationError(e) });
        return true;
      }
    },
    [walletAddress, market, debtManager, publicClient, isContract],
  );

  const approve = useCallback(
    async (assets: bigint) => {
      if (!debtManager || !market || !walletAddress || !publicClient) return;
      try {
        const max = await publicClient.readContract({
          address: market,
          abi: marketAbi,
          functionName: 'previewWithdraw',
          args: [(assets * 100_005n) / 100_000n],
          account: walletAddress,
        });
        const { id } = await sendCalls({
          chainId: defaultChain.id,
          experimental_fallback: true,
          calls: [{ to: market, abi: erc20Abi, functionName: 'approve', args: [debtManager, max] }],
        });
        setApproveCallId(id);
      } catch (e: unknown) {
        setErrorData({ status: true, message: handleOperationError(e) });
      }
    },
    [debtManager, market, walletAddress, publicClient, sendCalls],
  );

  const submit = useCallback(
    async (execute: () => Promise<Hex | undefined>): Promise<void> => {
      setSubmitting(true);
      try {
        const hash = await execute();
        if (!hash) return;
        setTx({ status: 'success', hash });
        await refetch();
        if (walletAddress) {
          void queryClient.invalidateQueries({
            queryKey: getContractEventsQueryKey({
              abi: marketAbi,
              eventName: 'BorrowAtMaturity',
              args: { borrower: walletAddress },
              chainId: defaultChain.id,
            }),
          });
          void queryClient.invalidateQueries({
            queryKey: getContractEventsQueryKey({
              abi: marketAbi,
              eventName: 'RepayAtMaturity',
              args: { borrower: walletAddress },
              chainId: defaultChain.id,
            }),
          });
        }
      } catch (e: unknown) {
        setErrorData({ status: true, message: handleOperationError(e) });
      } finally {
        setSubmitting(false);
      }
    },
    [refetch, queryClient, walletAddress],
  );

  const value: ContextValues = {
    input,
    setFrom,
    setTo,
    setPercent,
    setSlippage,

    debtManager,

    errorData,
    setErrorData,
    tx,
    isLoading: sendCallsPending || approveWaiting || submitting,

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
