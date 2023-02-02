import { EthereumClient, modalConnectors, walletConnectProvider } from '@web3modal/ethereum';
import { createClient, configureChains } from 'wagmi';
import { jsonRpcProvider } from 'wagmi/providers/jsonRpc';
import { mainnet, goerli } from 'wagmi/chains';
import { publicProvider } from 'wagmi/providers/public';
import { SafeConnector } from './SafeConnector';

declare global {
  interface Window {
    rpcURL?: string;
  }
}
const rpcURL = typeof window !== 'undefined' ? window?.rpcURL : undefined;

export const walletConnectId = '11ddaa8aaede72cb5d6b0dae2fed7baa';

export const supportedChains = [
  mainnet,
  ...(JSON.parse(process.env.NEXT_PUBLIC_ENABLE_TESTNETS ?? 'false') ? [goerli] : []),
];

export const defaultChain = { mainnet, goerli }[process.env.NEXT_PUBLIC_NETWORK ?? 'mainnet'];

const { chains, provider } = configureChains(supportedChains, [
  ...(JSON.parse(process.env.NEXT_PUBLIC_IS_E2E ?? 'false') && rpcURL
    ? [jsonRpcProvider({ rpc: () => ({ http: rpcURL }) })]
    : [publicProvider(), walletConnectProvider({ projectId: walletConnectId })]),
]);

export const wagmi = createClient({
  connectors: [...modalConnectors({ appName: 'exactly', chains }), new SafeConnector({ chains })],
  provider,
});

export const web3modal = new EthereumClient(wagmi, chains);
