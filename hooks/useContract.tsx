import { ethers } from "ethers";
import { useEffect, useState } from "react";
import useProvider from "./useProvider";

export default function useContract(
  address: string,
  abi: ethers.ContractInterface
) {
  const [contract, setContract] = useState<ethers.Contract | undefined>(
    undefined
  );

  useEffect(() => {
    getContract();
  }, []);

  async function getContract() {
    const provider = ethers.getDefaultProvider("rinkeby");
    let contract = new ethers.Contract(address, abi, provider);

    contract = contract.connect(provider);

    setContract(contract);
  }

  return { contract };
}
