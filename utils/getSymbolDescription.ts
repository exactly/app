import { MarketAccount } from 'hooks/useAccountData';
import { optimism } from 'wagmi/chains';

export default (marketAccount: MarketAccount, symbol: string, displayNetworkId: number) => {
  if (symbol === 'WETH') {
    return 'Ether';
  } else if (symbol === 'USDC' && displayNetworkId === optimism.id) {
    return 'Bridged USDC';
  } else {
    return marketAccount.assetName;
  }
};
