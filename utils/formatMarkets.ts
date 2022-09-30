import { formatFixed, parseFixed } from '@ethersproject/bignumber';

import { AccountData } from 'types/AccountData';
import { Dictionary } from 'types/Dictionary';
import { Market } from 'types/Market';

export default function formatMarkets(accountData: AccountData) {
  const dictionary: Dictionary<number> = {
    DAI: 1,
    USDC: 2,
    WETH: 3,
    WBTC: 4
  };

  const formattedMarkets: Array<Market> = [];

  const WAD = parseFixed('1', 18);

  Object.keys(accountData).forEach((assetName) => {
    const market = accountData[assetName];

    const newMarket = {
      market: market.market,
      symbol: market.assetSymbol,
      name: assetName,
      isListed: false,
      collateralFactor: 0,
      order: dictionary[assetName],
      borrowed: formatFixed(
        market.totalFloatingBorrowAssets.mul(market.oraclePrice).div(WAD),
        market.decimals
      ),
      supplied: formatFixed(
        market.totalFloatingDepositAssets.mul(market.oraclePrice).div(WAD),
        market.decimals
      ),
      decimals: market.decimals,
      exchangeRate: market.oraclePrice
    };

    formattedMarkets.push(newMarket);
  });

  return formattedMarkets.sort((a: Market, b: Market) => {
    return a.order > b.order ? 1 : -1;
  });
}
