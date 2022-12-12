import { useMemo } from 'react';
import { useSigner } from 'wagmi';
import { Contract } from '@ethersproject/contracts';
import type { Market } from 'types/contracts/Market';
import marketABI from 'abi/Market.json';

export default (address?: string) => {
  const { data: signer } = useSigner();

  const marketContract = useMemo(() => {
    if (!address || !signer) return;

    return new Contract(address, marketABI, signer) as Market;
  }, [address, signer]);

  return marketContract;
};
