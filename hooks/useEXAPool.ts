import { useWeb3 } from './useWeb3';

import { exaPoolABI, useExaPoolGetReserves, useExaPoolTotalSupply } from 'types/abi';
import useContract from './useContract';

export const useEXAPool = () => {
  return useContract('EXAPool', exaPoolABI);
};

export const useEXAPoolGetReserves = (args?: { watch?: boolean; staleTime?: number }) => {
  const { chain } = useWeb3();
  const pool = useEXAPool();

  return useExaPoolGetReserves({
    ...args,
    chainId: chain.id,
    address: pool?.address,
  });
};

export const useEXAPoolTotalSupply = (args?: { watch?: boolean }) => {
  const { chain } = useWeb3();
  const pool = useEXAPool();

  return useExaPoolTotalSupply({
    ...args,
    chainId: chain.id,
    address: pool?.address,
  });
};
