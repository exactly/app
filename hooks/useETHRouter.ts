import { MarketETHRouter } from 'types/contracts';
import MarketETHRouterABI from 'abi/MarketETHRouter.json' assert { type: 'json' };
import useContract from './useContract';

export default () => {
  return useContract<MarketETHRouter>('MarketETHRouter', MarketETHRouterABI);
};
