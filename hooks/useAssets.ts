import { useMemo } from 'react';
import useAccountData from './useAccountData';

export default (): string[] => {
  const { accountData } = useAccountData();

  if (accountData) {
    accountData.sort((a, b) => {
      return Number(
        b.totalFloatingDepositAssets
          .mul(b.usdPrice)
          .div(10n ** BigInt(b.decimals))
          .sub(a.totalFloatingDepositAssets.mul(a.usdPrice).div(10n ** BigInt(a.decimals))),
      );
    });
  }

  return useMemo<string[]>(() => (accountData ? accountData.map((m) => m.assetSymbol) : []), [accountData]);
};
