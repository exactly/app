import networkData from 'config/networkData.json';

export type Network = 'rinkeby' | 'goerli' | 'mainnet';

export const getTokenEtherscanUrl = (network: Network, address: string): string =>
  `${networkData[network].etherscanBaseUrl}/token/${address}`;
