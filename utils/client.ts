import { EthereumClient, modalConnectors, walletConnectProvider } from '@web3modal/ethereum';
import { createClient, configureChains } from 'wagmi';
import { mainnet, goerli, optimism } from 'wagmi/chains';
import { publicProvider } from 'wagmi/providers/public';
import { SafeConnector } from 'wagmi/connectors/safe';

export const walletConnectId = '11ddaa8aaede72cb5d6b0dae2fed7baa';

export const supportedChains = [
  mainnet,
  optimism,
  ...(JSON.parse(process.env.NEXT_PUBLIC_ENABLE_TESTNETS ?? 'false') ? [goerli] : []),
];

export const defaultChain = { mainnet, optimism, goerli }[process.env.NEXT_PUBLIC_NETWORK ?? 'mainnet'];

const { chains, provider } = configureChains(supportedChains, [
  publicProvider({ priority: 1 }),
  walletConnectProvider({ projectId: walletConnectId }),
]);

export const wagmi = createClient({
  connectors: [...modalConnectors({ appName: 'exactly', chains }), new SafeConnector({ chains })],
  provider,
});

export const web3modal = new EthereumClient(wagmi, chains);
