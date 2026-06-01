import { Hex } from 'viem';
import usePreviewerExactly from './usePreviewerExactly';
import { useMemo } from 'react';
import { NATIVE_TOKEN_ADDRESS } from 'types/Bridge';

const usePrices = (): Record<Hex, bigint> => {
  const { data: accountData } = usePreviewerExactly();

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
