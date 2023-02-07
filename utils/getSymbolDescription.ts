import { AccountData } from 'types/AccountData';

export default (accountData: AccountData, symbol: string) => {
  return symbol === 'WETH' ? 'Ether' : accountData[symbol].assetName;
};
