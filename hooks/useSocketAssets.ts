import { useState, useCallback, useEffect } from 'react';
import { AssetBalance } from 'types/Bridge';
import { useWeb3 } from './useWeb3';
import { socketRequest } from 'utils/socket';

const ETH = {
  chainId: 10,
  address: '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee',
  name: 'Ethereum',
  symbol: 'ETH',
  decimals: 18,
  chainAgnosticId: null,
  icon: 'https://maticnetwork.github.io/polygon-token-assets/assets/eth.svg',
  logoURI: 'https://maticnetwork.github.io/polygon-token-assets/assets/eth.svg',
  amount: 0,
} satisfies AssetBalance;

export default () => {
  const [assets, setAssets] = useState<AssetBalance[]>([ETH]);

  const { walletAddress, chain } = useWeb3();

  const fetchAssets = useCallback(async () => {
    if (!walletAddress || !process.env.NEXT_PUBLIC_SOCKET_API_KEY) return;

    const result = await socketRequest<AssetBalance[]>('balances', { userAddress: walletAddress });

    if (result.length === 0) return;

    setAssets(result.filter(({ chainId }) => chainId === chain.id).sort((a, b) => b.amount - a.amount));
  }, [chain.id, walletAddress]);

  useEffect(() => {
    fetchAssets();
  }, [fetchAssets]);

  return assets;
};
