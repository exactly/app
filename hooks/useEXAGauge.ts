import { useWeb3 } from './useWeb3';

import { exaGaugeABI, useExaGaugeRewardRate } from 'types/abi';
import useContract from './useContract';

export const useEXAGauge = () => {
  return useContract('EXAGauge', exaGaugeABI);
};

export const useEXAGaugeRewardRate = (args?: { watch?: boolean }) => {
  const { chain } = useWeb3();
  const exaGauge = useEXAGauge();

  return useExaGaugeRewardRate({
    ...args,
    chainId: chain.id,
    address: exaGauge?.address,
  });
};
