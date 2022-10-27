import type { ContractInterface } from '@ethersproject/contracts';
import type { Signer } from '@ethersproject/abstract-signer';
import { InfuraProvider } from '@ethersproject/providers';
import { Contract } from '@ethersproject/contracts';

export function getContractData(
  network: string | undefined,
  address: string,
  abi: ContractInterface,
  providerData?: Signer,
) {
  if (!address || !abi) return;

  const publicNetwork = network ?? process.env.NEXT_PUBLIC_NETWORK;

  try {
    let provider;

    if (providerData) {
      provider = providerData;
    } else {
      provider = new InfuraProvider(publicNetwork);
    }

    return new Contract(address, abi, provider).connect(provider);
  } catch (e) {
    console.log(e);
  }
}
