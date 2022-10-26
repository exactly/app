import { AccountData } from 'types/AccountData';
import { Dictionary } from 'types/Dictionary';
import { Market } from 'types/Market';

export default function formatMarkets(accountData: AccountData) {
  const dictionary: Dictionary<number> = {
    DAI: 1,
    USDC: 2,
    WETH: 3,
    WBTC: 4,
  };

  const formattedMarkets: Array<Market> = [];

  Object.keys(accountData).forEach((assetName) => {
    const market = accountData[assetName];

    const newMarket = {
      market: market.market,
      symbol: market.assetSymbol,
      name: assetName,
      isListed: false,
      collateralFactor: 0,
      order: dictionary[assetName],
    };

    formattedMarkets.push(newMarket);
  });

  return formattedMarkets.sort((a: Market, b: Market) => {
    return a.order > b.order ? 1 : -1;
  });
}
