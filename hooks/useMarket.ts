import { useMemo } from 'react';
import { useSigner } from 'wagmi';
import { Contract } from '@ethersproject/contracts';
import type { Market } from 'types/contracts/Market';
import marketABI from 'abi/Market.json';

export default (address?: string): Market | undefined => {
  const { data: signer } = useSigner();

  const marketContract = useMemo(() => {
    if (!address) return;

    return new Contract(address, marketABI, signer ?? undefined) as Market;
  }, [address, signer]);

  return marketContract;
};
