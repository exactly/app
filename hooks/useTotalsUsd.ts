import { useMemo } from 'react';
import { parseUnits } from 'viem';
import useAccountData from './useAccountData';

export default () => {
  const { accountData } = useAccountData();

  const { totalDepositedUSD, totalBorrowedUSD } = useMemo<{
    totalDepositedUSD: bigint;
    totalBorrowedUSD: bigint;
  }>(() => {
    if (!accountData) return { totalDepositedUSD: 0n, totalBorrowedUSD: 0n };

    const { depositedUSD, borrowedUSD } = accountData.reduce(
      (
        acc,
        {
          floatingDepositAssets,
          floatingBorrowAssets,
          usdPrice,
          fixedDepositPositions,
          fixedBorrowPositions,
          decimals,
        },
      ) => {
        const WADDecimals = parseUnits('1', decimals);

        // iterate through fixed deposited pools to get totals
        const { fixedTotalDeposited } = fixedDepositPositions.reduce(
          (fixedPoolStats, pool) => {
            const { position } = pool;

            fixedPoolStats.fixedTotalDeposited += position.principal;
            return fixedPoolStats;
          },
          { fixedTotalDeposited: 0n },
        );

        // iterate through fixed borrowed pools to get totals
        const { fixedTotalBorrowed } = fixedBorrowPositions.reduce(
          (fixedPoolStats, pool) => {
            const { position } = pool;

            fixedPoolStats.fixedTotalBorrowed += position.principal;
            return fixedPoolStats;
          },
          { fixedTotalBorrowed: 0n },
        );

        acc.depositedUSD += ((floatingDepositAssets + fixedTotalDeposited) * usdPrice) / WADDecimals;
        acc.borrowedUSD += ((floatingBorrowAssets + fixedTotalBorrowed) * usdPrice) / WADDecimals;
        return acc;
      },
      { depositedUSD: 0n, borrowedUSD: 0n },
    );

    return { totalDepositedUSD: depositedUSD, totalBorrowedUSD: borrowedUSD };
  }, [accountData]);

  return { totalDepositedUSD, totalBorrowedUSD };
};
