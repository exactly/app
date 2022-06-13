import { ethers } from 'ethers';

export function getContractData(
  network: string | undefined,
  address: string,
  abi: ethers.ContractInterface,
  providerData?: ethers.Signer
) {
  if (!address || !abi) return;

  const publicNetwork = network ?? process.env.NEXT_PUBLIC_NETWORK;

  let provider;

  if (providerData) {
    provider = providerData;
  } else {
    provider = new ethers.providers.InfuraProvider(publicNetwork, {
      projectId: '77a2479dc2bd4436aa3edb374f3019d2',
      projectSecret: process.env.NEXT_INFURA_ID
    });
  }

  return new ethers.Contract(address, abi, provider).connect(provider);
}
