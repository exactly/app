import { ethers } from 'ethers';
import { useEffect, useState } from 'react';
import { useWeb3Context } from 'contexts/Web3Context';

const useContract = (address: string, abi: ethers.ContractInterface) => {
  const [contract, setContract] = useState<ethers.Contract | undefined>(undefined);
  const { web3Provider } = useWeb3Context();

  useEffect(() => {
    getContract();
  }, []);

  async function getContract() {
    let provider;
    const publicNetwork = process.env.NEXT_PUBLIC_NETWORK;

    if (publicNetwork == 'local') {
      provider = new ethers.providers.JsonRpcProvider();
    } else {
      if (web3Provider) {
        provider = web3Provider;
      } else {
        provider = ethers.getDefaultProvider(publicNetwork);
      }
    }

    if (address && abi && provider) {
      let contract = new ethers.Contract(address, abi, provider);

      contract = contract.connect(provider);

      setContract(contract);
    }
  }

  return { contract };
};

export default useContract;
