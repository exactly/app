import { EthereumClient, modalConnectors, walletConnectProvider } from '@web3modal/ethereum';
import { createClient, configureChains } from 'wagmi';
import { mainnet, goerli } from 'wagmi/chains';
import { publicProvider } from 'wagmi/providers/public';

const { NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID } = process.env;

if (!NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID) throw new Error('missing wallet connect project id');

const { chains, provider } = configureChains(
  [mainnet, goerli],
  [publicProvider(), walletConnectProvider({ projectId: NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID })],
);

export const wagmi = createClient({
  autoConnect: true,
  connectors: modalConnectors({ appName: 'exactly', chains }),
  provider,
});

export const web3modal = new EthereumClient(wagmi, chains);
