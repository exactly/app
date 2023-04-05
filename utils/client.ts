import { EthereumClient, w3mConnectors, w3mProvider } from '@web3modal/ethereum';
import { createClient, configureChains } from 'wagmi';
import { InjectedConnector } from 'wagmi/connectors/injected';
import { jsonRpcProvider } from 'wagmi/providers/jsonRpc';
import { publicProvider } from 'wagmi/providers/public';
import { SafeConnector } from 'wagmi/connectors/safe';

import { supportedChains, walletConnectId, e2eRPCURL, isE2E } from './chain';

const { chains, provider } = configureChains(
  supportedChains,
  isE2E && e2eRPCURL
    ? [jsonRpcProvider({ rpc: () => ({ http: String(e2eRPCURL) }) })]
    : [publicProvider({ priority: 1 }), w3mProvider({ projectId: walletConnectId })],
);

export const wagmi = createClient({
  connectors: [
    ...(isE2E ? [new InjectedConnector({ chains: supportedChains, options: { name: 'E2E' } })] : []),
    ...w3mConnectors({ projectId: walletConnectId, version: 1, chains }),
    new SafeConnector({ chains }),
  ],
  provider,
});

export const web3modal = new EthereumClient(wagmi, chains);
