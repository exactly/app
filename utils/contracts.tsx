import { ethers } from 'ethers';
import { useWeb3Context } from 'contexts/Web3Context';

export async function getContractData(
  address: string,
  abi: ethers.ContractInterface,
  withSigner: boolean
) {
  if (!address || !abi) return;

  const publicNetwork = process.env.NEXT_PUBLIC_NETWORK;
  let provider;

  if (withSigner) {
    provider = await getProvider();
  } else {
    provider =
      publicNetwork == 'local'
        ? new ethers.providers.JsonRpcProvider()
        : ethers.getDefaultProvider(publicNetwork);
  }

  return new ethers.Contract(address, abi, provider).connect(provider);
}

async function getProvider() {
  const { provider } = useWeb3Context();

  return provider;
}
