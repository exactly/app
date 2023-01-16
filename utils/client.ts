import { EthereumClient, modalConnectors, walletConnectProvider } from '@web3modal/ethereum';
import { createClient, configureChains } from 'wagmi';
import { jsonRpcProvider } from 'wagmi/providers/jsonRpc';
import { mainnet, goerli } from 'wagmi/chains';
import { publicProvider } from 'wagmi/providers/public';
import { SafeConnector } from './SafeConnector';

export const walletConnectId = '11ddaa8aaede72cb5d6b0dae2fed7baa';

export const supportedChains = [
  mainnet,
  ...(JSON.parse(process.env.NEXT_PUBLIC_ENABLE_TESTNETS ?? 'false') ? [goerli] : []),
];

export const defaultChain = { mainnet, goerli }[process.env.NEXT_PUBLIC_NETWORK ?? 'mainnet'];

const { chains, provider } = configureChains(supportedChains, [
  ...(JSON.parse(process.env.NEXT_PUBLIC_USE_TENDERLY_RPC ?? 'false')
    ? [jsonRpcProvider({ rpc: () => ({ http: 'https://rpc.tenderly.co/fork/a58acb82-0ddf-4e31-90c3-1c37ddfd2c9e' }) })]
    : []),
  publicProvider(),
  walletConnectProvider({ projectId: walletConnectId }),
]);

export const wagmi = createClient({
  connectors: [...modalConnectors({ appName: 'exactly', chains }), new SafeConnector({ chains })],
  provider,
});

export const web3modal = new EthereumClient(wagmi, chains);
