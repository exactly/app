const symbolDescriptions: Record<string, string> = {
  USDC: 'USD Coin',
  DAI: 'DAI Stablecoin',
  WETH: 'Ether',
  WBTC: 'Wrapped BTC',
  wstETH: 'Lido Wrapped Staked ETH',
};

export default (symbol: string) => {
  return symbolDescriptions[symbol] || 'Coin';
};
