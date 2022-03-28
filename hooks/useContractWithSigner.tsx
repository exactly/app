import { ethers } from 'ethers';
import { useEffect, useState } from 'react';
import { useWeb3Context } from 'contexts/Web3Context';

export default function useContractWithSigner(
  address: string | undefined,
  abi: ethers.ContractInterface
) {
  const { web3Provider, connect } = useWeb3Context();

  const [contract, setContract] = useState<ethers.Contract | undefined>(undefined);

  const [contractWithSigner, setContractWithSigner] = useState<ethers.Contract | undefined>(
    undefined
  );

  const [signer, setSigner] = useState<ethers.providers.JsonRpcSigner | undefined>(undefined);

  useEffect(() => {
    if (address && abi && web3Provider) {
      getContract();
    } else if (!web3Provider && connect) {
      connect();
    }
  }, [web3Provider, address, abi, connect]);

  async function getContract() {
    try {
      if (!web3Provider) return;
      const contract = new ethers.Contract(address!, abi, web3Provider);

      const signer = web3Provider?.getSigner();

      let contractWithSigner = undefined;

      if (contract && signer) {
        contractWithSigner = contract.connect(signer!);
      }

      setContract(contract);
      setSigner(signer);
      setContractWithSigner(contractWithSigner);
    } catch (e) {
      console.log(e);
    }
  }

  return { contract, signer, contractWithSigner };
}
