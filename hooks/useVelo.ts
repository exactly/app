import { useMemo } from 'react';
import { useAssetPrice } from './useSocketAPI';
import { useEXAPrice } from './useEXA';
import useAccountData from './useAccountData';
import { useEXAGaugeRewardRate } from './useEXAGauge';
import { useEXAPoolGetReserves } from './useEXAPool';
import { parseEther } from 'viem';
import { toPercentage } from 'utils/utils';
import { WEI_PER_ETHER } from 'utils/const';

type Velo = {
  poolAPR?: string;
  veloPrice?: number;
};

export default (): Velo => {
  const velo = useAssetPrice('0x9560e827af36c94d2ac33a39bce1fe78631088db');
  const exa = useEXAPrice();
  const { marketAccount: weth } = useAccountData('WETH');

  const { data: rewardRate } = useEXAGaugeRewardRate();
  const { data: reserves } = useEXAPoolGetReserves();

  const veloAPR = useMemo(() => {
    if (!velo || !exa || !weth || !rewardRate || !reserves) return;

    const veloPrice = parseEther(String(velo.tokenPrice));

    return toPercentage(
      Number(
        (rewardRate * 86_400n * 365n * veloPrice) / ((reserves[0] * exa + reserves[1] * weth.usdPrice) / WEI_PER_ETHER),
      ) / 1e18,
    );
  }, [velo, exa, weth, rewardRate, reserves]);

  return {
    poolAPR: veloAPR,
    veloPrice: velo?.tokenPrice,
  };
};
