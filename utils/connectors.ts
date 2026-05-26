import { createConnector, mock } from 'wagmi';
import {
  createWalletClient,
  custom,
  http,
  numberToHex,
  type Chain,
  type EIP1193Parameters,
  type Hex,
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
  const connector = mock({
    accounts: [account.address],
    features: { defaultConnected: true, reconnect: true },
  });

  const chainFor = (id = currentChainId) => chains.find((chain) => chain.id === id) ?? chains[0];

  const walletClientFor = (id = currentChainId): WalletClient => {
    return createWalletClient({
      account,
      chain: chainFor(id),
      transport: http(rpc),
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
        const { method } = requestParameters;
        if (method === 'eth_chainId') return numberToHex(currentChainId);
        if (method === 'eth_accounts' || method === 'eth_requestAccounts') return [account.address];
        if (method === 'wallet_switchEthereumChain') {
          const { params } = requestParameters;
          const [{ chainId: nextChainId }] = params;
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
