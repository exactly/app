import { useContext, useEffect, useMemo, useState } from 'react';
import { useSigner } from 'wagmi';
import { Contract } from '@ethersproject/contracts';
import type { ERC20 } from 'types/contracts/ERC20';
import erc20ABI from 'abi/ERC20.json';
import { useOperationContext } from 'contexts/OperationContext';
import { MarketContext } from 'contexts/MarketContext';
import useMarket from './useMarket';

export default (): ERC20 | undefined => {
  const { data: signer } = useSigner();
  const { market } = useContext(MarketContext);
  const { symbol } = useOperationContext();

  const marketContract = useMarket(market?.value);

  const [assetAddress, setAssetAddress] = useState<string | undefined>();

  useEffect(() => {
    if (!marketContract || symbol === 'WETH') return;

    void marketContract.asset().then(setAssetAddress);
  }, [marketContract, symbol]);

  const assetContract = useMemo(() => {
    if (!signer || !assetAddress) return;

    return new Contract(assetAddress, erc20ABI, signer) as ERC20;
  }, [assetAddress, signer]);

  return assetContract;
};
