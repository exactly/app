import { useMemo } from 'react';
import { useStaticContext } from 'contexts/StaticContext';
import useAccountData from './useAccountData';

export default (): string[] => {
  const { accountData } = useAccountData();
  const { assets } = useStaticContext();

  return useMemo<string[]>(() => {
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

    return accountData?.map(({ assetSymbol }) => assetSymbol) ?? assets;
  }, [accountData, assets]);
};
