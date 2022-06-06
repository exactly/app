import { Dictionary } from 'types/Dictionary';

function getAssetColor(asset: string) {
  const parsedAsset = asset.toUpperCase();

  const dictionary: Dictionary<string> = {
    DAI: '#F19D2B',
    USDC: '#2775CA',
    WETH: '#627EEA',
    WBTC: '#282138'
  };

  return dictionary[parsedAsset];
}

export default getAssetColor;
