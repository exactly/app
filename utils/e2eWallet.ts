import {
  BaseError,
  MethodNotSupportedRpcError,
  RpcRequestError,
  createWalletClient,
  decodeErrorResult,
  formatTransaction,
  isAddressEqual,
  numberToHex,
  http,
  type Chain,
  type Hex,
  type LocalAccount,
  type RpcTransactionRequest,
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
    const account = parameters.account?.type === 'local' ? parameters.account : undefined;
    const chain: Chain | undefined = parameters.chain;
    let signer: WalletClient<Transport, Chain, LocalAccount> | undefined;
    const request = async (...[args, options]: Parameters<typeof base.request>) => {
      const { method, params } = args;
      if (method === 'eth_fillTransaction' || method === 'wallet_sendCalls') {
        throw new MethodNotSupportedRpcError(
          new RpcRequestError({ body: { method, params }, error: { code: -32601, message: 'disabled' }, url: rpc }),
        );
      }
      if (method === 'eth_estimateGas') return gas;
      if (method === 'eth_sendTransaction' || method === 'wallet_sendTransaction') {
        const [transaction] = params as [RpcTransactionRequest];
        if (!account || !signer || !transaction.from || !isAddressEqual(transaction.from, account.address)) {
          throw new BaseError(
            `E2E wallet ${account?.address ?? 'unavailable'} cannot sign transaction from ${transaction.from ?? 'unknown'}`,
          );
        }
        const formatted = formatTransaction(transaction);
        for (const key of ['blockHash', 'blockNumber', 'transactionIndex', 'typeHex', 'v', 'yParity'] as const) {
          Reflect.deleteProperty(formatted, key);
        }
        return signer.sendTransaction({ ...formatted, account });
      }
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
        console.error(`e2e revert ${transactionHash}: ${revertReason(trace?.output)}\n${JSON.stringify(trace)}`);
      }
      return result;
    };
    const transport = { ...base, request: request as typeof base.request };
    if (account && chain) signer = createWalletClient({ account, chain, transport: () => transport });
    return transport;
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
