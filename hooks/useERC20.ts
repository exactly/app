import { useMemo } from 'react';
import { useSigner } from 'wagmi';
import { Contract } from '@ethersproject/contracts';
import type { ERC20 } from 'types/contracts/ERC20';
import erc20ABI from 'abi/ERC20.json';
import { useOperationContext } from 'contexts/OperationContext';
import useAccountData from './useAccountData';

export default (): ERC20 | undefined => {
  const { data: signer } = useSigner();
  const { symbol } = useOperationContext();

  const { asset: assetAddress } = useAccountData(symbol);

  const assetContract = useMemo(() => {
    if (!signer || !assetAddress) return;

    return new Contract(assetAddress, erc20ABI, signer) as ERC20;
  }, [assetAddress, signer]);

  return assetContract;
};
