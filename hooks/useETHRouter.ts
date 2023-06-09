import { marketEthRouterABI } from 'types/abi';
import useContract from './useContract';

export default () => {
  return useContract('MarketETHRouter', marketEthRouterABI);
};
