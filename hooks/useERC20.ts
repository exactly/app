import { useMemo } from 'react';
import { useSigner } from 'wagmi';
import { Contract } from '@ethersproject/contracts';
import type { ERC20 } from 'types/contracts/ERC20';
import erc20ABI from 'abi/ERC20.json';

export default (address?: string) => {
  const { data: signer } = useSigner();

  const assetContract = useMemo(() => {
    if (!signer || !address) return;

    return new Contract(address, erc20ABI, signer) as ERC20;
  }, [address, signer]);

  return assetContract;
};
