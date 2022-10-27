import { AccountData } from 'types/AccountData';

export default (data: AccountData) =>
  Object.values(data)
    .map(({ market, assetSymbol: symbol }) => ({
      market,
      symbol,
      isListed: false,
      collateralFactor: 0,
      order: { DAI: 1, USDC: 1 }[symbol] ?? 0,
    }))
    .sort((a, b) => b.order - a.order);
