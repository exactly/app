import { useMemo } from 'react';
import { formatUnits, type Address } from 'viem';
import { useBalance } from 'wagmi';
import usePreviewerExactly from './usePreviewerExactly';
import { defaultChain } from 'utils/client';
import useReadOnly from 'hooks/useReadOnly';
import { useReadErc20BalanceOf } from 'generated/wagmi';

export default (symbol?: string, asset?: Address, useERC20 = false, chainId?: number): string | undefined => {
  const { account: walletAddress } = useReadOnly();
  const { data } = usePreviewerExactly();
  const marketAccount = data?.find((market) => market.assetSymbol === symbol);
  const shouldUseNativeBalance = symbol === 'WETH' && !useERC20;

  const { data: nativeBalance, error: nativeError } = useBalance({
    address: walletAddress,
    chainId: chainId ?? defaultChain.id,
    query: { enabled: Boolean(walletAddress && shouldUseNativeBalance) },
  });
  const { data: tokenBalance, error: tokenError } = useReadErc20BalanceOf({
    address: asset,
    args: walletAddress ? [walletAddress] : undefined,
    chainId: chainId ?? defaultChain.id,
    query: { enabled: Boolean(walletAddress && asset && !shouldUseNativeBalance) },
  });

  return useMemo(() => {
    if (shouldUseNativeBalance) {
      if (!nativeBalance || nativeError) return;
      return formatUnits(nativeBalance.value, nativeBalance.decimals);
    }

    if (tokenBalance === undefined || tokenError || !asset) return;

    return formatUnits(tokenBalance, marketAccount?.decimals ?? 18);
  }, [asset, marketAccount?.decimals, nativeBalance, nativeError, shouldUseNativeBalance, tokenBalance, tokenError]);
};
