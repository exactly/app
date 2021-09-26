import { ethers } from "ethers";
import { useEffect, useState } from "react";
import useProvider from "./useProvider";

export default function useContract(
  address: string,
  abi: ethers.ContractInterface
) {
  const provider = useProvider();

  const [contract, setContract] = useState<ethers.Contract | undefined>(
    undefined
  );

  useEffect(() => {
    getContract();
  }, [provider]);

  async function getContract() {
    const contract = new ethers.Contract(address, abi, provider);

    setContract(contract);
  }

  return { contract };
}
