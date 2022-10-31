import networkData from 'config/networkData.json';

export type Network = 'rinkeby' | 'goerli' | 'mainnet' | 'homestead';

export const getTokenEtherscanUrl = (network: Network, address: string): string =>
  `${networkData[network].etherscanBaseUrl}/token/${address}`;

export const getTxEtherscanUrl = (network: Network, txHash: string): string =>
  `${networkData[network].etherscanBaseUrl}/tx/${txHash}`;
