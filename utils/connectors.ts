import { createConnector, mock } from 'wagmi';
import {
  createPublicClient,
  createWalletClient,
  custom,
  http,
  numberToHex,
  type Chain,
  type EIP1193Parameters,
  type Hex,
  type Transport,
  type WalletClient,
  type WalletRpcSchema,
} from 'viem';
import { privateKeyToAccount } from 'viem/accounts';

type E2EConnectorParameters = {
  privateKey: Hex;
  rpc: string;
  chainId: number;
  chains: readonly [Chain, ...Chain[]];
};

export function e2eConnector({ privateKey, rpc, chainId, chains }: E2EConnectorParameters) {
  const account = privateKeyToAccount(privateKey);
  let currentChainId = chainId;
  const callStatuses = new Map<Hex, { chainId: Hex; error?: string; receipts: unknown[]; status: number }>();
  const connector = mock({
    accounts: [account.address],
    features: { defaultConnected: true, reconnect: true },
  });

  const chainFor = (id = currentChainId): Chain => ({
    ...(chains.find((chain) => chain.id === id) ?? chains[0]),
    fees: {
      estimateFeesPerGas: async ({ type }) =>
        type === 'legacy' ? { gasPrice: 0n } : { maxFeePerGas: 0n, maxPriorityFeePerGas: 0n },
      maxPriorityFeePerGas: 0n,
    },
  });

  const walletClientFor = (walletChainId = currentChainId): WalletClient => {
    return createWalletClient({
      account,
      chain: chainFor(walletChainId),
      transport: ((parameters) => {
        const transport = http(rpc)(parameters);
        return {
          ...transport,
          request: async ({ method, params }, options) => {
            if (method === 'eth_gasPrice' || method === 'eth_maxPriorityFeePerGas') return numberToHex(0);
            if (method === 'wallet_sendCalls') {
              const [{ calls, chainId: targetChainId = numberToHex(currentChainId) }] = params as unknown as [
                { calls: readonly { data?: Hex; to?: Hex; value?: Hex }[]; chainId?: Hex },
              ];
              const callId = numberToHex(Date.now() + Math.floor(Math.random() * 1_000_000), { size: 32 });
              const publicClient = createPublicClient({ chain: chainFor(Number(targetChainId)), transport: http(rpc) });
              const receipts: unknown[] = [];
              let error: string | undefined;
              let status = 200;

              for (const [index, call] of calls.entries()) {
                try {
                  if (!call.to) throw new Error('Missing call target');
                  const transaction = {
                    account,
                    data: call.data,
                    gasPrice: 0n,
                    to: call.to,
                    value: call.value ? BigInt(call.value) : undefined,
                  };
                  const gas = (await publicClient.estimateGas(transaction)) * 2n;
                  await publicClient.call({ ...transaction, gas });
                  const hash = await walletClientFor(Number(targetChainId)).sendTransaction({
                    ...transaction,
                    chain: chainFor(Number(targetChainId)),
                    gas,
                  });
                  await publicClient.waitForTransactionReceipt({ hash });
                  const receipt = await publicClient.request({ method: 'eth_getTransactionReceipt', params: [hash] });
                  receipts.push(receipt);
                  if (receipt?.status !== '0x1') {
                    error = `wallet_sendCalls call ${index + 1}/${calls.length} reverted: ${hash}`;
                    status = 500;
                    break;
                  }
                } catch (cause) {
                  error = cause instanceof Error ? cause.stack ?? cause.message : String(cause);
                  status = 500;
                  break;
                }
              }

              if (error)
                setTimeout(
                  (message) => {
                    throw new Error(message);
                  },
                  0,
                  error,
                );
              callStatuses.set(callId, { chainId: numberToHex(Number(targetChainId)), receipts, status, error });
              return { id: callId };
            }
            if (method === 'wallet_getCallsStatus') {
              const [callId] = params as [Hex];
              return callStatuses.get(callId) ?? { chainId: numberToHex(currentChainId), receipts: [], status: 100 };
            }
            if (
              (method === 'eth_call' ||
                method === 'eth_estimateGas' ||
                method === 'eth_sendTransaction' ||
                method === 'wallet_sendTransaction') &&
              Array.isArray(params) &&
              params[0] &&
              typeof params[0] === 'object'
            ) {
              const [{ maxFeePerGas, maxPriorityFeePerGas, ...transaction }, ...rest] = params as [
                Record<string, unknown>,
                ...unknown[],
              ];
              void maxFeePerGas;
              void maxPriorityFeePerGas;
              const next: Record<string, unknown> = { ...transaction, gasPrice: numberToHex(0) };
              return transport.request(
                {
                  method,
                  params:
                    method === 'eth_sendTransaction' || method === 'wallet_sendTransaction'
                      ? [
                          {
                            ...next,
                            gas:
                              next.gas ??
                              numberToHex(
                                BigInt(
                                  await transport.request(
                                    { method: 'eth_estimateGas', params: [next] } as Parameters<
                                      typeof transport.request
                                    >[0],
                                    options,
                                  ),
                                ) * 2n,
                              ),
                          },
                          ...rest,
                        ]
                      : [next, ...rest],
                } as Parameters<typeof transport.request>[0],
                options,
              );
            }
            return transport.request({ method, params } as Parameters<typeof transport.request>[0], options);
          },
        };
      }) as Transport,
    });
  };

  return createConnector((config) => ({
    ...connector(config),
    id: 'mock',
    name: 'Mock',
    type: 'mock',
    async getClient({ chainId: clientChainId } = {}) {
      return walletClientFor(clientChainId);
    },
    async getProvider({ chainId: providerChainId } = {}) {
      const request = async (requestParameters: EIP1193Parameters<WalletRpcSchema>) => {
        const method = requestParameters.method as string;
        if (method === 'eth_chainId') return numberToHex(currentChainId);
        if (method === 'eth_accounts' || method === 'eth_requestAccounts') return [account.address];
        if (method === 'wallet_switchEthereumChain') {
          const [{ chainId: nextChainId }] = requestParameters.params as [{ chainId: Hex }];
          currentChainId = Number(nextChainId);
          config.emitter.emit('change', { chainId: currentChainId });
          return;
        }
        if (method === 'wallet_watchAsset') return true;
        return walletClientFor(providerChainId).request(requestParameters);
      };

      return custom({ request })({ retryCount: 0 });
    },
    onChainChanged(nextChainId) {
      currentChainId = Number(nextChainId);
      config.emitter.emit('change', { chainId: currentChainId });
    },
    async switchChain({ chainId: nextChainId }) {
      const chain = chains.find(({ id }) => id === nextChainId);
      if (!chain) throw new Error(`Chain ${nextChainId} is not configured for E2E`);
      currentChainId = nextChainId;
      config.emitter.emit('change', { chainId: nextChainId });
      return chain;
    },
  }));
}
