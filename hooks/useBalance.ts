import { useMemo } from 'react';
import { formatUnits } from 'viem';
import { Address, useBalance } from 'wagmi';
import { useWeb3 } from './useWeb3';

export default (symbol?: string, asset?: Address): string | undefined => {
  const { walletAddress, chain } = useWeb3();

  const { data, error } = useBalance({
    address: walletAddress,
    token: symbol === 'WETH' ? undefined : asset,
    chainId: chain.id,
  });

  return useMemo(() => {
    if (!data || (!asset && symbol !== 'WETH')) return;
    if (error) return;

    return formatUnits(data.value, data.decimals);
  }, [data, asset, symbol, error]);
};
