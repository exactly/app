import { Contract } from '@ethersproject/contracts';
import { useWeb3Context } from 'contexts/Web3Context';
import ERC20ABI from 'abi/ERC20.json';
import { ERC20 } from 'types/contracts/ERC20';
import { useMemo } from 'react';

export default (address?: string) => {
  const { web3Provider } = useWeb3Context();

  const assetContract = useMemo(() => {
    if (!address) return;

    return new Contract(address, ERC20ABI, web3Provider?.getSigner()) as ERC20;
  }, [address, web3Provider]);

  return assetContract;
};
