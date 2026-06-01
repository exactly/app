import { useMemo } from 'react';
import { WAD } from '@exactly/lib';

import usePreviewerExactly from './usePreviewerExactly';
import usePrices from './usePrices';
import { NATIVE_TOKEN_ADDRESS } from 'types/Bridge';

export const useEXAPrice = () => {
  const { data: accountData } = usePreviewerExactly();

  return useMemo(() => {
    if (!accountData) return 0n;

    return accountData.flatMap((marketAccount) => {
      const x = marketAccount.rewardRates.find((reward) => reward.assetSymbol === 'EXA');

      return x ? [x.usdPrice] : [1000000000000000000n];
    })[0];
  }, [accountData]);
};

export const useEXAETHPrice = () => {
  const prices = usePrices();
  const ETHPrice = prices[NATIVE_TOKEN_ADDRESS];
  const EXAPrice = useEXAPrice();
  return useMemo(() => (EXAPrice ? (EXAPrice * WAD) / ETHPrice : undefined), [ETHPrice, EXAPrice]);
};
