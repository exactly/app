import { useMemo } from 'react';
import { useAssetPrice } from './useSocketAPI';
import { useEXAPrice } from './useEXA';
import useAccountData from './useAccountData';
import { useEXAGaugeBalanceOf, useEXAGaugeRewardRate } from './useEXAGauge';
import { useEXAPoolGetReserves, useEXAPoolTotalSupply } from './useEXAPool';
import { parseEther } from 'viem';
import { toPercentage } from 'utils/utils';
import { WEI_PER_ETHER } from 'utils/const';

import { veloABI } from 'types/abi';
import useContract from './useContract';

type VELOAccountStatus = {
  poolAPR?: string;
  veloPrice?: number;
  userBalanceUSD?: bigint;
};

export const useVELO = () => {
  return useContract('VELO', veloABI);
};

export const useVELOPoolAPR = () => {
  const velo = useVELO();
  const asset = useAssetPrice(velo?.address);
  const { data: rewardRate } = useEXAGaugeRewardRate();
  const { data: reserves } = useEXAPoolGetReserves();

  const { marketAccount: weth } = useAccountData('WETH');

  const apr = useMemo(() => {
    if (!asset || !weth || !rewardRate || !reserves) return;

    const veloPrice = parseEther(String(asset.tokenPrice));

    return toPercentage(
      Number((rewardRate * 86_400n * 365n * veloPrice) / ((2n * reserves[1] * weth.usdPrice) / WEI_PER_ETHER)) / 1e18,
    );
  }, [asset, weth, rewardRate, reserves]);

  return apr;
};

export default (): VELOAccountStatus => {
  const velo = useVELO();
  const asset = useAssetPrice(velo?.address);
  const exa = useEXAPrice();
  const { marketAccount: weth } = useAccountData('WETH');

  const { data: rewardRate } = useEXAGaugeRewardRate({ watch: true });
  const { data: reserves } = useEXAPoolGetReserves({ watch: true });
  const { data: totalSupply } = useEXAPoolTotalSupply({ watch: true });
  const { data: balance } = useEXAGaugeBalanceOf({ watch: true });

  const veloAPR = useMemo(() => {
    if (!asset || !weth || !rewardRate || !reserves) return;

    const veloPrice = parseEther(String(asset.tokenPrice));

    return toPercentage(
      Number((rewardRate * 86_400n * 365n * veloPrice) / ((2n * reserves[1] * weth.usdPrice) / WEI_PER_ETHER)) / 1e18,
    );
  }, [asset, weth, rewardRate, reserves]);

  const userBalanceUSD = useMemo(() => {
    if (!reserves || !balance || !totalSupply || !exa || !weth) return undefined;

    const balanceEXA = (reserves[0] * balance) / totalSupply;
    const balanceWETH = (reserves[1] * balance) / totalSupply;

    return (balanceEXA * exa + balanceWETH * weth.usdPrice) / WEI_PER_ETHER;
  }, [balance, exa, reserves, totalSupply, weth]);

  return {
    poolAPR: veloAPR,
    veloPrice: asset?.tokenPrice,
    userBalanceUSD,
  };
};
