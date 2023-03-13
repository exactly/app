import { useMemo } from 'react';
import useAccountData from './useAccountData';

type YieldRates = {
  maturity: number;
  [key: string]: number;
};

export default function useYieldRates(symbol: string) {
  const { accountData, getMarketAccount } = useAccountData();

  const { loading, depositsRates, borrowsRates } = useMemo<{
    loading: boolean;
    depositsRates: YieldRates[];
    borrowsRates: YieldRates[];
  }>(() => {
    if (!accountData || !getMarketAccount(symbol)) return { loading: true, depositsRates: [], borrowsRates: [] };

    const dRates: YieldRates[] = [];
    const bRates: YieldRates[] = [];

    accountData.forEach(({ fixedPools, assetSymbol }) => {
      Object.values(
        fixedPools.map(({ maturity, depositRate, minBorrowRate }) => {
          const depositIndex = dRates.findIndex((deposit) => deposit.maturity === maturity.toNumber());
          if (depositIndex > -1) {
            dRates[depositIndex][assetSymbol] = Number(depositRate.toBigInt()) / 1e18;
          } else {
            dRates.push({
              maturity: maturity.toNumber(),
              [assetSymbol]: Number(depositRate.toBigInt()) / 1e18,
            });
          }
          const borrowIndex = bRates.findIndex((deposit) => deposit.maturity === maturity.toNumber());
          if (borrowIndex > -1) {
            bRates[borrowIndex][assetSymbol] = Number(minBorrowRate.toBigInt()) / 1e18;
          } else {
            bRates.push({
              maturity: maturity.toNumber(),
              [assetSymbol]: Number(minBorrowRate.toBigInt()) / 1e18,
            });
          }
        }),
      );
    });

    const assetsWithPositiveRates = [
      ...new Set(
        dRates.flatMap((yieldRate) => [symbol, ...Object.keys(yieldRate).filter((key) => yieldRate[key] > 0)]),
      ),
    ];

    const positiveDepositRates = dRates.map((deposit) =>
      Object.keys(deposit)
        .filter((key) => assetsWithPositiveRates.includes(key))
        .reduce((obj, key) => {
          obj[key] = deposit[key];
          return obj;
        }, {} as YieldRates),
    );

    return { depositsRates: positiveDepositRates, borrowsRates: bRates, loading: false };
  }, [accountData, getMarketAccount, symbol]);

  return { loading, depositsRates, borrowsRates };
}
