import { anvil, base, baseSepolia, mainnet, optimism, optimismSepolia, type Chain } from 'viem/chains';

export const deploymentNetworkByChainId = {
  [mainnet.id]: 'ethereum',
  [optimism.id]: 'optimism',
  [optimismSepolia.id]: 'op-sepolia',
  [base.id]: 'base',
  [baseSepolia.id]: 'base-sepolia',
  [anvil.id]: 'anvil',
} as const;

export type DeploymentNetwork = (typeof deploymentNetworkByChainId)[keyof typeof deploymentNetworkByChainId];

export function getDeploymentNetwork(chain: Pick<Chain, 'id'>): DeploymentNetwork {
  const deploymentNetwork = Object.entries(deploymentNetworkByChainId).find(
    ([chainId]) => Number(chainId) === chain.id,
  )?.[1];
  if (!deploymentNetwork) throw new Error(`Unsupported Exactly deployment chain: ${chain.id}`);
  return deploymentNetwork;
}
