import {
  MethodNotSupportedRpcError,
  RpcRequestError,
  createWalletClient,
  decodeErrorResult,
  numberToHex,
  http,
  type Chain,
  type Hex,
  type Transport,
  type WalletClient,
} from 'viem';
import { nonceManager, privateKeyToAccount } from 'viem/accounts';
import { createConnector, mock } from 'wagmi';

import errorAbi from './ErrorInterface';

const gas = numberToHex(2n ** 24n);

export function e2eTransport(rpc: string): Transport {
  return ((parameters) => {
    const base = http(rpc)(parameters);
    return {
      ...base,
      request: async ({ method, params }, options) => {
        if (method === 'eth_fillTransaction') {
          throw new MethodNotSupportedRpcError(
            new RpcRequestError({ body: { method, params }, error: { code: -32601, message: 'disabled' }, url: rpc }),
          );
        }
        if (method === 'eth_estimateGas') return gas;
        const result = await base.request({ method, params } as Parameters<typeof base.request>[0], options);
        if (method === 'eth_getTransactionReceipt' && (result as { status?: Hex } | null)?.status === '0x0') {
          const { transactionHash } = result as { transactionHash: Hex };
          const trace = (await base
            .request({
              method: 'debug_traceTransaction',
              params: [transactionHash, { tracer: 'callTracer' }],
            } as Parameters<typeof base.request>[0])
            .catch(() => undefined)) as { output?: Hex } | undefined;
          // eslint-disable-next-line no-console
          console.error(`e2e revert ${transactionHash}: ${revertReason(trace?.output)}`);
        }
        return result;
      },
    };
  }) as Transport;
}

function revertReason(data?: Hex): string | undefined {
  if (!data || data === '0x') return data;
  try {
    const { errorName, args } = decodeErrorResult({ abi: errorAbi, data });
    return args?.length ? `${errorName}(${args.join(', ')})` : errorName;
  } catch {
    return data;
  }
}

export function e2eConnector({
  privateKey,
  rpc,
  chainId,
  chains,
}: {
  privateKey: Hex;
  rpc: string;
  chainId: number;
  chains: readonly [Chain, ...Chain[]];
}) {
  const account = privateKeyToAccount(privateKey, { nonceManager });
  const transport = e2eTransport(rpc);
  let currentChainId = chainId;
  const clientFor = (id: number): WalletClient => {
    const chain = chains.find((c) => c.id === id) ?? chains[0];
    return createWalletClient({ account, chain, transport });
  };
  const base = mock({ accounts: [account.address], features: { defaultConnected: true, reconnect: true } });
  return createConnector((config) => ({
    ...base(config),
    async getClient({ chainId: id } = {}) {
      return clientFor(id ?? currentChainId);
    },
    async switchChain({ chainId: nextChainId }) {
      const chain = chains.find(({ id }) => id === nextChainId);
      if (!chain) throw new Error(`Chain ${nextChainId} is not configured`);
      currentChainId = nextChainId;
      config.emitter.emit('change', { chainId: nextChainId });
      return chain;
    },
  }));
}
