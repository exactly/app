import { useMemo } from 'react';
import { useAssetPrice } from './useSocketAPI';
import { useEXAPrice } from './useEXA';
import useAccountData from './useAccountData';
import { useEXAGaugeBalanceOf, useEXAGaugeRewardRate } from './useEXAGauge';
import { useEXAPoolGetReserves, useEXAPoolTotalSupply } from './useEXAPool';
import { parseEther } from 'viem';
import { toPercentage } from 'utils/utils';
import { WEI_PER_ETHER } from 'utils/const';

type Velo = {
  poolAPR?: string;
  veloPrice?: number;
  userBalanceUSD?: bigint;
};

export default (): Velo => {
  const velo = useAssetPrice('0x9560e827af36c94d2ac33a39bce1fe78631088db');
  const exa = useEXAPrice();
  const { marketAccount: weth } = useAccountData('WETH');

  const { data: rewardRate } = useEXAGaugeRewardRate();
  const { data: reserves } = useEXAPoolGetReserves();
  const { data: totalSupply } = useEXAPoolTotalSupply();
  const { data: balance } = useEXAGaugeBalanceOf();

  const veloAPR = useMemo(() => {
    if (!velo || !exa || !weth || !rewardRate || !reserves) return;

    const veloPrice = parseEther(String(velo.tokenPrice));

    return toPercentage(
      Number(
        (rewardRate * 86_400n * 365n * veloPrice) / ((reserves[0] * exa + reserves[1] * weth.usdPrice) / WEI_PER_ETHER),
      ) / 1e18,
    );
  }, [velo, exa, weth, rewardRate, reserves]);

  const userBalanceUSD = useMemo(() => {
    if (!reserves || !balance || !totalSupply || !exa || !weth) return undefined;

    const balanceEXA = (reserves[0] * balance) / totalSupply;
    const balanceWETH = (reserves[1] * balance) / totalSupply;

    return (balanceEXA * exa + balanceWETH * weth.usdPrice) / WEI_PER_ETHER;
  }, [balance, exa, reserves, totalSupply, weth]);

  return {
    poolAPR: veloAPR,
    veloPrice: velo?.tokenPrice,
    userBalanceUSD,
  };
};
