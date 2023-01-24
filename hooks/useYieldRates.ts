import { useCallback, useContext, useEffect, useState } from 'react';
import AccountDataContext from 'contexts/AccountDataContext';

type YieldRates = {
  maturity: number;
  [key: string]: number;
};

export default function useYieldRates(symbol?: string) {
  const { accountData } = useContext(AccountDataContext);
  const [loading, setLoading] = useState<boolean>(true);
  const [depositsRates, setDepositsRates] = useState<YieldRates[]>([]);
  const [borrowsRates, setBorrowsRates] = useState<YieldRates[]>([]);

  const getYields = useCallback(() => {
    if (!accountData) return;
    setLoading(true);

    const depositRates: YieldRates[] = [];
    const borrowRates: YieldRates[] = [];

    Object.values(accountData).forEach(({ fixedPools, assetSymbol }) => {
      Object.values(
        fixedPools.map(({ maturity, depositRate, minBorrowRate }) => {
          const depositIndex = depositRates.findIndex((deposit) => deposit.maturity === maturity.toNumber());
          if (depositIndex > -1) {
            depositRates[depositIndex][assetSymbol] = Number(depositRate.toBigInt()) / 1e18;
          } else {
            depositRates.push({
              maturity: maturity.toNumber(),
              [assetSymbol]: Number(depositRate.toBigInt()) / 1e18,
            });
          }
          const borrowIndex = borrowRates.findIndex((deposit) => deposit.maturity === maturity.toNumber());
          if (borrowIndex > -1) {
            borrowRates[borrowIndex][assetSymbol] = Number(minBorrowRate.toBigInt()) / 1e18;
          } else {
            borrowRates.push({
              maturity: maturity.toNumber(),
              [assetSymbol]: Number(minBorrowRate.toBigInt()) / 1e18,
            });
          }
        }),
      );
    });

    const assetsWithPositiveRates = [
      ...new Set(
        depositRates.flatMap((yieldRate) => [symbol, ...Object.keys(yieldRate).filter((key) => yieldRate[key] > 0)]),
      ),
    ];

    const positiveDepositRates = depositRates.map((deposit) =>
      Object.keys(deposit)
        .filter((key) => assetsWithPositiveRates.includes(key))
        .reduce((obj, key) => {
          obj[key] = deposit[key];
          return obj;
        }, {} as YieldRates),
    );

    setDepositsRates(positiveDepositRates);
    setBorrowsRates(borrowRates);

    setLoading(false);
  }, [accountData, symbol]);

  useEffect(() => {
    void getYields();
  }, [getYields]);

  return { loading, depositsRates, borrowsRates };
}
