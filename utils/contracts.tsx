import { ethers } from 'ethers';

export function getContractData(
  network: string | undefined,
  address: string,
  abi: ethers.ContractInterface,
  providerData?: ethers.Signer
) {
  if (!address || !abi) return;

  const publicNetwork = network ?? process.env.NEXT_PUBLIC_NETWORK;

  try {
    let provider;

    if (providerData) {
      provider = providerData;
    } else {
      provider = new ethers.providers.InfuraProvider(publicNetwork);
    }

    return new ethers.Contract(address, abi, provider).connect(provider);
  } catch (e) {
    console.log(e);
  }
}
