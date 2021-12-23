import { ethers } from "ethers";
import { useEffect, useState } from "react";
import useProvider from "./useProvider";

export default function useContractWithSigner(
  address: string | undefined,
  abi: ethers.ContractInterface
) {
  const { web3Provider, getProvider } = useProvider();

  const [contract, setContract] = useState<ethers.Contract | undefined>(
    undefined
  );

  const [contractWithSigner, setContractWithSigner] = useState<
    ethers.Contract | undefined
  >(undefined);

  const [signer, setSigner] = useState<
    ethers.providers.JsonRpcSigner | undefined
  >(undefined);

  useEffect(() => {
    if (address && abi && web3Provider) {
      getContract();
    }
  }, [web3Provider]);

  useEffect(() => {
    setProvider();
  }, []);

  async function setProvider() {
    await getProvider();
  }

  async function getContract() {
    const contract = new ethers.Contract(address!, abi, web3Provider);

    const signer = web3Provider?.getSigner();
    let contractWithSigner = undefined;

    if (contract && signer) {
      contractWithSigner = contract.connect(signer!);
    }

    setContract(contract);
    setSigner(signer);
    setContractWithSigner(contractWithSigner);
  }

  return { contract, signer, contractWithSigner };
}
