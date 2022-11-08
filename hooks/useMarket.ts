import { Contract } from '@ethersproject/contracts';
import { useWeb3Context } from 'contexts/Web3Context';
import MarketABI from 'abi/Market.json';
import { Market } from 'types/contracts/Market';
import { useMemo } from 'react';

export default (address?: string) => {
  const { web3Provider } = useWeb3Context();

  const marketContract = useMemo(() => {
    if (!address) return;

    return new Contract(address, MarketABI, web3Provider?.getSigner()) as Market;
  }, [address, web3Provider]);

  return marketContract;
};
