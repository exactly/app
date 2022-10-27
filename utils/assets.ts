import assetDataJSON from 'config/assetData.json';

const assetData = assetDataJSON as Record<string, { description: string }>;

export const getAssetData = (symbol: string) => assetData[symbol];
