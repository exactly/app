import { MarketAccount } from 'hooks/useAccountData';

export default (marketAccount: MarketAccount, symbol: string) => {
  return symbol === 'WETH' ? 'Ether' : marketAccount.assetName;
};
