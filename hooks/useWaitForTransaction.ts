// https://github.com/wagmi-dev/wagmi/blob/wagmi@1.4.5/packages/react/src/hooks/transactions/useWaitForTransaction.ts
import type { WaitForTransactionArgs, WaitForTransactionResult } from '@wagmi/core';
import { useChainId, useQuery } from 'wagmi';
import waitForTransaction from 'utils/waitForTransaction';

export type UseWaitForTransactionArgs = Partial<WaitForTransactionArgs>;
export type UseWaitForTransactionConfig = {
  cacheTime?: number;
  enabled?: boolean;
  scopeKey?: string;
  staleTime?: number;
  suspense?: boolean;
  onError?: (error: Error) => void;
  onSettled?: (data: WaitForTransactionResult | undefined, error: Error | null) => void;
  onSuccess?: (data: WaitForTransactionResult) => void;
};

type QueryKeyArgs = Partial<UseWaitForTransactionArgs>;
type QueryKeyConfig = Pick<UseWaitForTransactionConfig, 'scopeKey'>;

function queryKey({ confirmations, chainId, hash, scopeKey, timeout }: QueryKeyArgs & QueryKeyConfig) {
  return [{ entity: 'waitForTransaction', confirmations, chainId, hash, scopeKey, timeout }] as const;
}

function queryFn({ onReplaced }: { onReplaced?: WaitForTransactionArgs['onReplaced'] }) {
  return ({ queryKey: [{ chainId, confirmations, hash, timeout }] }: { queryKey: ReturnType<typeof queryKey> }) => {
    if (!hash) throw new Error('hash is required');
    return waitForTransaction({ chainId, confirmations, hash, onReplaced, timeout });
  };
}

export default function useWaitForTransaction({
  chainId: chainId_,
  confirmations,
  hash,
  timeout,
  cacheTime,
  enabled = true,
  scopeKey,
  staleTime,
  suspense,
  onError,
  onReplaced,
  onSettled,
  onSuccess,
}: UseWaitForTransactionArgs & UseWaitForTransactionConfig = {}) {
  const chainId = useChainId({ chainId: chainId_ });

  return useQuery(queryKey({ chainId, confirmations, hash, scopeKey, timeout }), queryFn({ onReplaced }), {
    cacheTime,
    enabled: Boolean(enabled && hash),
    staleTime,
    suspense,
    onError,
    onSettled,
    onSuccess,
  });
}
