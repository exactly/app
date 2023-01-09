import { useCallback, useContext, useEffect, useState } from 'react';
import AccountDataContext from 'contexts/AccountDataContext';

type YieldRates = {
  maturity: number;
  [key: string]: number;
};

export default function useYieldRates() {
  const { accountData } = useContext(AccountDataContext);
  const [loading, setLoading] = useState<boolean>(true);
  const [depositsRates, setDepositsRates] = useState<YieldRates[]>([]);
  const [borrowsRates, setBorrowsRates] = useState<YieldRates[]>([]);

  const getYields = useCallback(() => {
    if (!accountData) return;
    setLoading(true);

    const depositRates: YieldRates[] = [];
    const borrowRates: YieldRates[] = [];

    Object.values(accountData).forEach((market) => {
      const { fixedPools, assetSymbol } = market;

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

    setDepositsRates(depositRates);
    setBorrowsRates(borrowRates);

    setLoading(false);
  }, [accountData]);

  useEffect(() => {
    void getYields();
  }, [getYields]);

  return { loading, depositsRates, borrowsRates };
}
