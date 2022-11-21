function getAssetColor(asset: string) {
  const dictionary: Record<string, string> = {
    DAI: '#F19D2B',
    USDC: '#2775CA',
    WETH: '#627EEA',
    WBTC: '#282138',
  };

  return dictionary[asset];
}

export default getAssetColor;
