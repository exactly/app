import { useState, useCallback, useEffect } from 'react';
import { AssetBalance, NATIVE_TOKEN_ADDRESS } from 'types/Bridge';
import { useWeb3 } from './useWeb3';
import { socketRequest } from 'utils/socket';
import usePrices from './usePrices';
import useBalance from './useBalance';
import { Hex } from 'viem';
import VELO_ from '@exactly/protocol/deployments/optimism/VELO.json' assert { type: 'json' };
import useVELO from './useVELO';

export const ETH = {
  chainId: 10,
  address: NATIVE_TOKEN_ADDRESS,
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
  address: VELO_.address as Hex,
  name: 'Velodrome',
  symbol: 'VELO',
  decimals: 18,
  chainAgnosticId: null,
  icon: 'https://velodrome.finance/velodrome.svg',
  logoURI: 'https://velodrome.finance/velodrome.svg',
  amount: null,
  usdAmount: null,
} satisfies Omit<AssetBalance, 'amount' | 'usdAmount'> & { amount: null; usdAmount: null };

export default (disableFetch?: boolean, chainId?: number) => {
  const [assets, setAssets] = useState<AssetBalance[]>([ETH]);
  const { walletAddress } = useWeb3();
  const prices = usePrices();
  const veloBalance = useBalance(VELO.symbol, VELO.address, true);
  const { veloPrice } = useVELO();

  const fetchAssets = useCallback(async () => {
    if (!walletAddress || !process.env.NEXT_PUBLIC_SOCKET_API_KEY || disableFetch) return;

    const result = await socketRequest<Omit<AssetBalance, 'usdAmount'>[]>('balances', { userAddress: walletAddress });

    if (result.length === 0) {
      return setAssets([ETH]);
    }

    setAssets(
      [...result, VELO]
        .filter((asset) => chainId === undefined || asset.chainId === chainId)
        .map((asset) => {
          const price = prices[asset.address.toLowerCase() as Hex];
          const amount = asset.amount ?? Number(veloBalance);
          return {
            ...asset,
            amount,
            usdAmount: price ? amount * (Number(price) / 1e18) : undefined,
            ...(asset.symbol === 'ETH'
              ? {
                  name: 'Ether',
                  icon: '/img/assets/WETH.svg',
                  logoURI: '/img/assets/WETH.svg',
                }
              : asset.symbol === 'VELO'
                ? {
                    usdAmount: veloPrice ? amount * veloPrice : undefined,
                  }
                : {}),
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
  }, [chainId, disableFetch, prices, veloBalance, veloPrice, walletAddress]);

  useEffect(() => {
    fetchAssets();
  }, [fetchAssets]);

  return assets;
};
