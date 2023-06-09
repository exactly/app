import { useMemo } from 'react';
import useAccountData from './useAccountData';

const def = ['USDC', 'WETH'];

export default (): string[] => {
  const { accountData } = useAccountData();

  return useMemo<string[]>(
    () =>
      accountData
        ? [...accountData]
            .sort((a, b) => {
              return Number(
                (b.totalFloatingDepositAssets * b.usdPrice) / 10n ** BigInt(b.decimals) -
                  (a.totalFloatingDepositAssets * a.usdPrice) / 10n ** BigInt(a.decimals),
              );
            })
            .map((m) => m.assetSymbol)
        : def,
    [accountData],
  );
};
