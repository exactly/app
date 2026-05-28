import {
  MethodNotSupportedRpcError,
  RpcRequestError,
  createWalletClient,
  numberToHex,
  http,
  type Chain,
  type Hex,
  type Transport,
  type WalletClient,
} from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { createConnector, mock } from 'wagmi';

const gas = numberToHex(2n ** 24n); // EIP-7825 transaction gas limit cap

export function e2eTransport(rpc: string): Transport {
  return ((parameters) => {
    const base = http(rpc)(parameters);
    return {
      ...base,
      request: ({ method, params }, options) => {
        if (method === 'eth_fillTransaction' || method === 'wallet_sendCalls') {
          throw new MethodNotSupportedRpcError(
            new RpcRequestError({ body: { method, params }, error: { code: -32601, message: 'disabled' }, url: rpc }),
          );
        }
        if (method === 'eth_gasPrice' || method === 'eth_maxPriorityFeePerGas') return Promise.resolve(numberToHex(0n));
        if (method === 'eth_estimateGas') return Promise.resolve(gas);
        if (method === 'eth_sendTransaction') {
          const [{ maxFeePerGas, maxPriorityFeePerGas, ...tx }, ...rest] = params as [
            Record<string, unknown>,
            ...unknown[],
          ];
          void maxFeePerGas;
          void maxPriorityFeePerGas;
          return base.request(
            { method, params: [{ ...tx, gas, gasPrice: numberToHex(0n) }, ...rest] } as Parameters<
              typeof base.request
            >[0],
            options,
          );
        }
        return base.request({ method, params } as Parameters<typeof base.request>[0], options);
      },
    };
  }) as Transport;
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
  const account = privateKeyToAccount(privateKey);
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
