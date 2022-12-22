import { EthereumClient, modalConnectors, walletConnectProvider } from '@web3modal/ethereum';
import { createClient, configureChains, Chain } from 'wagmi';
import { mainnet, optimism, goerli, optimismGoerli } from 'wagmi/chains';
import { publicProvider } from 'wagmi/providers/public';

export const walletConnectId = '11ddaa8aaede72cb5d6b0dae2fed7baa';

const { NEXT_PUBLIC_ENABLE_TESTNETS = 'false' } = process.env;

export const mainnetChains: Chain[] = [mainnet, optimism];
export const testnetChains: Chain[] = [goerli, optimismGoerli];
export const enableTestnets: boolean = JSON.parse(NEXT_PUBLIC_ENABLE_TESTNETS);
export const allowedChains: Chain[] = [...mainnetChains, ...(enableTestnets ? [...testnetChains] : [])];

const { chains, provider } = configureChains(allowedChains, [
  publicProvider(),
  walletConnectProvider({ projectId: walletConnectId }),
]);

export const wagmi = createClient({
  autoConnect: true,
  connectors: modalConnectors({ appName: 'exactly', chains }),
  provider,
});

export const web3modal = new EthereumClient(wagmi, chains);
