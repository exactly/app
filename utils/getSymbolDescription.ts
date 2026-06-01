import { MarketAccount } from 'hooks/usePreviewerExactly';

export default (marketAccount: MarketAccount, symbol: string) => {
  if (symbol === 'WETH') {
    return 'Ether';
  } else if (symbol === 'USDC.e') {
    return 'Bridged USDC';
  } else {
    return marketAccount.assetName;
  }
};
