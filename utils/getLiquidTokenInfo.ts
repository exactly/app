function getLiquidTokenInfo(symbol: string) {
  switch (symbol) {
    case 'wstETH':
      return "The displayed APR doesn't include the Lido Staked ETH APR";
    default:
      return;
  }
}

export default getLiquidTokenInfo;
