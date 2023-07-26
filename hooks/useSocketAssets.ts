import { useState, useCallback, useEffect } from 'react';
import { AssetBalance } from 'types/Bridge';
import { useWeb3 } from './useWeb3';

export default () => {
  const [assets, setAssets] = useState<AssetBalance[] | null>(null);

  const { walletAddress, chain } = useWeb3();

  const fetchAssets = useCallback(async () => {
    if (!walletAddress || !process.env.NEXT_PUBLIC_SOCKET_API_KEY) return;

    const response = await fetch(`https://api.socket.tech/v2/balances?userAddress=${walletAddress}`, {
      headers: {
        'API-KEY': process.env.NEXT_PUBLIC_SOCKET_API_KEY,
      },
    });

    const { result } = (await response.json()) as { result: AssetBalance[] };

    setAssets(result.filter(({ chainId }) => chainId === chain.id));
  }, [chain.id, walletAddress]);

  useEffect(() => {
    fetchAssets();
  }, [fetchAssets]);

  return assets;
};
