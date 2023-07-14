import { Hex } from 'viem';
import useAccountData from './useAccountData';
import { useMemo } from 'react';
import { NATIVE_TOKEN_ADDRESS } from 'types/Bridge';

const usePrices = (): Record<Hex, bigint> => {
  const { accountData } = useAccountData();

  return useMemo(() => {
    if (!accountData) return {};
    return Object.fromEntries(
      accountData?.flatMap(({ asset, usdPrice, assetSymbol }) =>
        assetSymbol === 'WETH'
          ? [
              [asset.toLowerCase(), usdPrice],
              [NATIVE_TOKEN_ADDRESS, usdPrice],
            ]
          : [[asset.toLowerCase(), usdPrice]],
      ),
    );
  }, [accountData]);
};

export default usePrices;
