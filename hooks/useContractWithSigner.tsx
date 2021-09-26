import { ethers } from "ethers";
import { useEffect, useState } from "react";
import useProvider from "./useProvider";

export default function useContractWithSigner(
  address: string,
  abi: ethers.ContractInterface
) {
  const provider = useProvider();

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
    getContract();
  }, [provider]);

  async function getContract() {
    const contract = new ethers.Contract(address, abi, provider);
    const signer = provider?.getSigner();
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
