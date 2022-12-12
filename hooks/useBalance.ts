import { useMemo } from 'react';
import { useBalance } from 'wagmi';
import { formatFixed } from '@ethersproject/bignumber';
import type { ERC20 } from 'types/contracts';
import { useWeb3 } from './useWeb3';

export default (symbol?: string, assetContract?: ERC20) => {
  const { walletAddress } = useWeb3();
  const { data } = useBalance({
    address: walletAddress as `0x${string}` | undefined,
    token: symbol === 'WETH' ? undefined : (assetContract?.address as `0x${string}` | undefined),
  });
  return useMemo(() => data && formatFixed(data.value, data.decimals), [data]);
};
