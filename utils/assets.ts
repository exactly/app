import assetsData from 'config/assetData.json'

export type AssetSymbol = "usdc" | "dai" | "weth" | "wbtc"

export type AssetData = {
    description: string
}

export const getAssetData = (symbol: AssetSymbol): AssetData => assetsData[symbol]
