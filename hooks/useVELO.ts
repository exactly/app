import { useCallback, useMemo } from 'react';
import { useAssetPrice } from './useSocketAPI';
import { useEXAPrice } from './useEXA';
import useAccountData from './useAccountData';
import { parseEther, zeroAddress } from 'viem';
import { toPercentage } from 'utils/utils';
import { WAD } from '@exactly/lib';

import {
  exaGaugeAddress,
  exaPoolAddress,
  useReadExaGaugeBalanceOf,
  useReadExaGaugeRewardRate,
  useReadExaPoolGetReserves,
  useReadExaPoolTotalSupply,
  veloAddress,
} from 'generated/wagmi';
import { defaultChain } from 'utils/client';
import useReadOnly from 'hooks/useReadOnly';

type VELOAccountStatus = {
  poolAPR?: string;
  veloPrice?: number;
  userBalanceUSD?: bigint;
  refetch: () => void;
};

const exaGaugeChainId = Object.keys(exaGaugeAddress)
  .map(Number)
  .find((chainId): chainId is keyof typeof exaGaugeAddress => chainId === defaultChain.id);
const exaPoolChainId = Object.keys(exaPoolAddress)
  .map(Number)
  .find((chainId): chainId is keyof typeof exaPoolAddress => chainId === defaultChain.id);
const veloChainId = Object.keys(veloAddress)
  .map(Number)
  .find((chainId): chainId is keyof typeof veloAddress => chainId === defaultChain.id);

export const useVELOPoolAPR = () => {
  const asset = useAssetPrice(veloChainId === undefined ? undefined : veloAddress[veloChainId]);
  const { data: rewardRate } = useReadExaGaugeRewardRate({
    chainId: exaGaugeChainId,
    query: { enabled: exaGaugeChainId !== undefined, staleTime: 30_000 },
  });
  const { data: reserves } = useReadExaPoolGetReserves({
    chainId: exaPoolChainId,
    query: { enabled: exaPoolChainId !== undefined, staleTime: 30_000 },
  });
  const { marketAccount: weth } = useAccountData('WETH');

  const apr = useMemo(() => {
    if (!asset || !weth || rewardRate === undefined || !reserves) return;

    const veloPrice = parseEther(String(asset.tokenPrice));

    return toPercentage(
      Number((rewardRate * 86_400n * 365n * veloPrice) / ((2n * reserves[1] * weth.usdPrice) / WAD)) / 1e18,
    );
  }, [asset, weth, rewardRate, reserves]);

  return apr;
};

export default (): VELOAccountStatus => {
  const { account: walletAddress } = useReadOnly();
  const asset = useAssetPrice(veloChainId === undefined ? undefined : veloAddress[veloChainId]);
  const exa = useEXAPrice();
  const { marketAccount: weth } = useAccountData('WETH');

  const { data: rewardRate, refetch: refetchEXAGaugeRewardRate } = useReadExaGaugeRewardRate({
    chainId: exaGaugeChainId,
    query: { enabled: exaGaugeChainId !== undefined },
  });
  const { data: reserves, refetch: refetchEXAPoolGetReserves } = useReadExaPoolGetReserves({
    chainId: exaPoolChainId,
    query: { enabled: exaPoolChainId !== undefined },
  });
  const { data: totalSupply, refetch: refetchEXAPoolTotalSupply } = useReadExaPoolTotalSupply({
    chainId: exaPoolChainId,
    query: { enabled: exaPoolChainId !== undefined },
  });
  const { data: balance, refetch: refetchEXAGaugeBalanceOf } = useReadExaGaugeBalanceOf({
    chainId: exaGaugeChainId,
    args: [walletAddress ?? zeroAddress],
    query: { enabled: exaGaugeChainId !== undefined },
  });

  const refetch = useCallback(() => {
    refetchEXAGaugeRewardRate();
    refetchEXAPoolGetReserves();
    refetchEXAPoolTotalSupply();
    refetchEXAGaugeBalanceOf();
  }, [refetchEXAGaugeBalanceOf, refetchEXAGaugeRewardRate, refetchEXAPoolGetReserves, refetchEXAPoolTotalSupply]);

  const veloAPR = useMemo(() => {
    if (!asset || !weth || rewardRate === undefined || !reserves) return;

    const veloPrice = parseEther(String(asset.tokenPrice));

    return toPercentage(
      Number((rewardRate * 86_400n * 365n * veloPrice) / ((2n * reserves[1] * weth.usdPrice) / WAD)) / 1e18,
    );
  }, [asset, weth, rewardRate, reserves]);

  const userBalanceUSD = useMemo(() => {
    if (!reserves || balance === undefined || totalSupply === undefined || exa === undefined || !weth) return undefined;

    const balanceEXA = (reserves[0] * balance) / totalSupply;
    const balanceWETH = (reserves[1] * balance) / totalSupply;

    return (balanceEXA * exa + balanceWETH * weth.usdPrice) / WAD;
  }, [balance, exa, reserves, totalSupply, weth]);

  return {
    poolAPR: veloAPR,
    veloPrice: asset?.tokenPrice,
    userBalanceUSD,
    refetch,
  };
};
