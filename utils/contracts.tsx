import { ethers } from "ethers";

export async function getContractData(address: string, abi: ethers.ContractInterface, withSigner: boolean) {
  if (!address || !abi) return;

  const publicNetwork = process.env.NEXT_PUBLIC_NETWORK;
  let provider;

  if (withSigner) {
    provider = await getProvider()
  } else {
    provider = publicNetwork == 'local' ? new ethers.providers.JsonRpcProvider() : ethers.getDefaultProvider(publicNetwork);
  }

  return new ethers.Contract(address, abi, provider).connect(provider);
}

async function getProvider() {
  await window?.ethereum?.request({ method: "eth_requestAccounts" });
  const web3Provider = new ethers.providers.Web3Provider(
    window.ethereum,
    "any"
  );

  return web3Provider;
}