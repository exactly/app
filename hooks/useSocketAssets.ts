import { useState, useCallback, useEffect } from 'react';
import { AssetBalance } from 'types/Bridge';
import { useWeb3 } from './useWeb3';
import { socketRequest } from 'utils/socket';
import usePrices from './usePrices';
import { parseUnits } from 'viem';

const ETH = {
  chainId: 10,
  address: '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee',
  name: 'Ether',
  symbol: 'ETH',
  decimals: 18,
  chainAgnosticId: null,
  icon: '/img/assets/WETH.svg',
  logoURI: '/img/assets/WETH.svg',
  amount: 0,
} satisfies AssetBalance;

export default (disableFetch?: boolean) => {
  const [assets, setAssets] = useState<AssetBalance[]>([ETH]);
  const { walletAddress, chain } = useWeb3();
  const prices = usePrices();

  const fetchAssets = useCallback(async () => {
    if (!walletAddress || !process.env.NEXT_PUBLIC_SOCKET_API_KEY || disableFetch) return;

    const result = await socketRequest<AssetBalance[]>('balances', { userAddress: walletAddress });

    if (result.length === 0) {
      return setAssets([ETH]);
    }

    setAssets(
      result
        .filter(({ chainId }) => chainId === chain.id)
        .sort((a, b) => {
          if (prices[a.address] === undefined && prices[b.address] === undefined) {
            return a.symbol.localeCompare(b.symbol);
          }

          if (prices[a.address] === undefined) return 1;
          if (prices[b.address] === undefined) return -1;

          return Number(
            parseUnits(b.amount.toString(), b.decimals) * prices[b.address] -
              parseUnits(a.amount.toString(), a.decimals) * prices[a.address],
          );
        })
        .map((asset) => ({
          ...asset,
          name: asset.symbol === 'ETH' ? 'Ether' : asset.name,
          icon: asset.symbol === 'ETH' ? '/img/assets/WETH.svg' : asset.icon,
          logoURI: asset.symbol === 'ETH' ? '/img/assets/WETH.svg' : asset.logoURI,
        })),
    );
  }, [chain.id, disableFetch, prices, walletAddress]);

  useEffect(() => {
    fetchAssets();
  }, [fetchAssets]);

  return assets;
};
