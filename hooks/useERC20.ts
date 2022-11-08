import { Contract } from '@ethersproject/contracts';
import { useWeb3Context } from 'contexts/Web3Context';
import ERC20ABI from 'abi/ERC20.json';
import { ERC20 } from 'types/contracts/ERC20';
import { useEffect, useState } from 'react';
import { ErrorData } from 'types/Error';

export default (address?: Promise<string>) => {
  const { web3Provider } = useWeb3Context();
  const [errorData, setErrorData] = useState<ErrorData | undefined>();
  const [assetContract, setAssetContract] = useState<ERC20 | undefined>();

  useEffect(() => {
    const loadContract = async () => {
      const contractAddress = await address;
      if (!contractAddress) return;
      setAssetContract(new Contract(contractAddress, ERC20ABI, web3Provider?.getSigner()) as ERC20);
    };

    loadContract().catch((error) => {
      setErrorData({ error, status: true, message: 'Failed to load contract' });
    });
  }, [address, web3Provider]);

  return { assetContract, errorData };
};
