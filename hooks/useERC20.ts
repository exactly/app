import { Contract } from '@ethersproject/contracts';
import { useWeb3Context } from 'contexts/Web3Context';
import ERC20ABI from 'abi/ERC20.json';
import { ERC20 } from 'types/contracts/ERC20';
import { useEffect, useState } from 'react';
import { ErrorData } from 'types/Error';

export default (address?: Promise<string>) => {
  const { web3Provider } = useWeb3Context();

  const [assetContract, setAssetContract] = useState<ERC20 | undefined>();
  const [errorData, setErrorData] = useState<ErrorData | undefined>();

  useEffect(() => {
    const loadAssetContract = async () => {
      if (!address || !(await address)) return;

      setAssetContract(new Contract(await address, ERC20ABI, web3Provider?.getSigner()) as ERC20);
    };

    loadAssetContract().catch((error) =>
      setErrorData({
        error,
        status: true,
      }),
    );
  }, [address, web3Provider]);

  return { assetContract, errorData };
};
