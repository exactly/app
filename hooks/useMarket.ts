import { Contract } from '@ethersproject/contracts';
import { useWeb3Context } from 'contexts/Web3Context';
import MarketABI from 'abi/Market.json';
import { Market } from 'types/contracts/Market';

export default (address?: string) => {
  const { web3Provider } = useWeb3Context();

  if (!address) return;

  return new Contract(address, MarketABI, web3Provider?.getSigner()) as Market;
};
