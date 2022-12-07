import { useContext, useMemo, useEffect, useState } from 'react';
import { Contract } from '@ethersproject/contracts';
import { useWeb3Context } from 'contexts/Web3Context';
import ERC20ABI from 'abi/ERC20.json';
import { ERC20 } from 'types/contracts/ERC20';
import { MarketContext } from 'contexts/MarketContext';
import useMarket from './useMarket';
import { useOperationContext } from 'contexts/OperationContext';

export default () => {
  const { web3Provider } = useWeb3Context();
  const { market } = useContext(MarketContext);
  const { symbol } = useOperationContext();

  const marketContract = useMarket(market?.value);

  const [assetAddress, setAssetAddress] = useState<string | undefined>();

  useEffect(() => {
    if (!marketContract || symbol === 'WETH') return;

    void marketContract.asset().then(setAssetAddress);
  }, [marketContract, symbol]);

  return useMemo(() => {
    if (!assetAddress) return;

    return new Contract(assetAddress, ERC20ABI, web3Provider?.getSigner()) as ERC20;
  }, [assetAddress, web3Provider]);
};
