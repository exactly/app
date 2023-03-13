import { Previewer } from 'types/contracts';

export default (marketAccount: Previewer.MarketAccountStructOutput, symbol: string) => {
  return symbol === 'WETH' ? 'Ether' : marketAccount.assetName;
};
