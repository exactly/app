import { useCallback, useMemo } from 'react';
import { useAssetPrice } from './useSocketAPI';
import { useEXAPrice } from './useEXA';
import useAccountData from './useAccountData';
import { useEXAGaugeBalanceOf, useEXAGaugeRewardRate } from './useEXAGauge';
import { useEXAPoolGetReserves, useEXAPoolTotalSupply } from './useEXAPool';
import { parseEther } from 'viem';
import { toPercentage } from 'utils/utils';
import WAD from '@exactly/lib/esm/fixed-point-math/WAD';

import { veloABI } from 'types/abi';
import useContract from './useContract';

type VELOAccountStatus = {
  poolAPR?: string;
  veloPrice?: number;
  userBalanceUSD?: bigint;
  refetch: () => void;
};

export const useVELO = () => {
  return useContract('VELO', veloABI);
};

export const useVELOPoolAPR = () => {
  const velo = useVELO();
  const asset = useAssetPrice(velo?.address);
  const { data: rewardRate } = useEXAGaugeRewardRate({ staleTime: 30_000 });
  const { data: reserves } = useEXAPoolGetReserves({ staleTime: 30_000 });

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
  const velo = useVELO();
  const asset = useAssetPrice(velo?.address);
  const exa = useEXAPrice();
  const { marketAccount: weth } = useAccountData('WETH');

  const { data: rewardRate, refetch: refetchEXAGaugeRewardRate } = useEXAGaugeRewardRate();
  const { data: reserves, refetch: refetchEXAPoolGetReserves } = useEXAPoolGetReserves();
  const { data: totalSupply, refetch: refetchEXAPoolTotalSupply } = useEXAPoolTotalSupply();
  const { data: balance, refetch: refetchEXAGaugeBalanceOf } = useEXAGaugeBalanceOf();

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
