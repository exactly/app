import { EthereumClient, modalConnectors, walletConnectProvider } from '@web3modal/ethereum';
import { createClient, configureChains } from 'wagmi';
import { mainnet, goerli, optimismGoerli } from 'wagmi/chains';
import { publicProvider } from 'wagmi/providers/public';

export const walletConnectId = '11ddaa8aaede72cb5d6b0dae2fed7baa';

const { NEXT_PUBLIC_ENABLE_TESTNETS = 'false' } = process.env;

const { chains, provider } = configureChains(
  [mainnet, ...(JSON.parse(NEXT_PUBLIC_ENABLE_TESTNETS) ? [goerli, optimismGoerli] : [])],
  [publicProvider(), walletConnectProvider({ projectId: walletConnectId })],
);

export const wagmi = createClient({
  autoConnect: true,
  connectors: modalConnectors({ appName: 'exactly', chains }),
  provider,
});

export const web3modal = new EthereumClient(wagmi, chains);
