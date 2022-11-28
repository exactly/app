import networkData from 'config/networkData.json';

export type Network = 'rinkeby' | 'goerli' | 'mainnet' | 'homestead';

export const getAddressEtherscanUrl = (network: Network, address: string | undefined): string =>
  `${networkData[network].etherscanBaseUrl}/address/${address}`;

export const getTxEtherscanUrl = (network: Network, txHash: string): string =>
  `${networkData[network].etherscanBaseUrl}/tx/${txHash}`;
