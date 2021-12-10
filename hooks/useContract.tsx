import { ethers } from "ethers";
import { useEffect, useState } from "react";

const useContract = (address: string, abi: ethers.ContractInterface) => {
  const [contract, setContract] = useState<ethers.Contract | undefined>(
    undefined
  );

  useEffect(() => {
    getContract();
  }, []);

  async function getContract() {
    let provider;
    const publicNetwork = process.env.NEXT_PUBLIC_NETWORK;

    if (publicNetwork == "local") {
      provider = new ethers.providers.JsonRpcProvider();
    } else {
      provider = ethers.getDefaultProvider(publicNetwork);
    }

    console.log(1, address, abi)
    let contract = new ethers.Contract(address, abi, provider);

    contract = contract.connect(provider);

    setContract(contract);
  }

  return { contract };
};

export default useContract;
