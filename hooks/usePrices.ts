import { Hex } from 'viem';
import useAccountData from './useAccountData';
import { useMemo } from 'react';

const NATIVE_TOKEN_ADDRESS = '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee';

const usePrices = (): Record<Hex, bigint> => {
  const { accountData } = useAccountData();

  return useMemo(() => {
    if (!accountData) return {};
    return Object.fromEntries(
      accountData?.flatMap(({ asset, usdPrice, assetSymbol }) =>
        assetSymbol === 'WETH'
          ? [
              [asset, usdPrice],
              [NATIVE_TOKEN_ADDRESS, usdPrice],
            ]
          : [[asset, usdPrice]],
      ),
    );
  }, [accountData]);
};

export default usePrices;
