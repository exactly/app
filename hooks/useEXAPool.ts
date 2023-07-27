import { useWeb3 } from './useWeb3';

import { exaPoolABI, useExaPoolGetReserves } from 'types/abi';
import useContract from './useContract';

export const useEXAPool = () => {
  return useContract('EXAPool', exaPoolABI);
};

export const useEXAPoolGetReserves = (args?: { watch?: boolean }) => {
  const { chain } = useWeb3();
  const pool = useEXAPool();

  return useExaPoolGetReserves({
    ...args,
    chainId: chain.id,
    address: pool?.address,
  });
};
