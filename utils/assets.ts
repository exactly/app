import assetsData from 'config/assetData.json'

export type AssetSymbol = "usdc" | "dai" | "weth" | "wbtc" | "wsteth"

export type AssetData = {
    description: string
}

export const getAssetData = (symbol: AssetSymbol): AssetData | undefined => assetsData[symbol]
