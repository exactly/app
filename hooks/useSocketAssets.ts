import { useState, useCallback, useEffect } from 'react';
import { AssetBalance } from 'types/Bridge';
import { useWeb3 } from './useWeb3';
import { socketRequest } from 'utils/socket';
import usePrices from './usePrices';
import useBalance from './useBalance';
import { Hex } from 'viem';

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
  usdAmount: 0,
} satisfies AssetBalance;

const VELO = {
  chainId: 10,
  address: '0x9560e827aF36c94D2Ac33a39bCE1Fe78631088Db',
  name: 'Velodrome V2',
  symbol: 'VELO',
  decimals: 18,
  chainAgnosticId: null,
  icon: 'https://velodrome.finance/velodrome.svg',
  logoURI: 'https://velodrome.finance/velodrome.svg',
  amount: null,
  usdAmount: null,
} satisfies Omit<AssetBalance, 'amount' | 'usdAmount'> & { amount: null; usdAmount: null };

export default (disableFetch?: boolean) => {
  const [assets, setAssets] = useState<AssetBalance[]>([ETH]);
  const { walletAddress, chain } = useWeb3();
  const prices = usePrices();
  const veloBalance = useBalance(VELO.symbol, VELO.address, true);

  const fetchAssets = useCallback(async () => {
    if (!walletAddress || !process.env.NEXT_PUBLIC_SOCKET_API_KEY || disableFetch) return;

    const result = await socketRequest<Omit<AssetBalance, 'usdAmount'>[]>('balances', { userAddress: walletAddress });

    if (result.length === 0) {
      return setAssets([ETH]);
    }

    setAssets(
      [...result, VELO]
        .filter(({ chainId }) => chainId === chain.id)
        .map((asset) => {
          const price = prices[asset.address.toLowerCase() as Hex];
          const amount = asset.amount ?? Number(veloBalance);
          return {
            ...asset,
            name: asset.symbol === 'ETH' ? 'Ether' : asset.name,
            icon: asset.symbol === 'ETH' ? '/img/assets/WETH.svg' : asset.icon,
            logoURI: asset.symbol === 'ETH' ? '/img/assets/WETH.svg' : asset.logoURI,
            amount,
            usdAmount: price ? amount * (Number(price) / 1e18) : undefined,
          };
        })
        .sort((a, b) =>
          a.usdAmount === undefined && b.usdAmount === undefined
            ? a.symbol.localeCompare(b.symbol)
            : a.usdAmount === undefined
            ? 1
            : b.usdAmount === undefined
            ? -1
            : b.usdAmount - a.usdAmount,
        ),
    );
  }, [chain.id, disableFetch, prices, veloBalance, walletAddress]);

  useEffect(() => {
    fetchAssets();
  }, [fetchAssets]);

  return assets;
};
