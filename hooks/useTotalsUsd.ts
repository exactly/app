import { BigNumber, parseFixed } from '@ethersproject/bignumber';
import { Zero } from '@ethersproject/constants';
import { useMemo } from 'react';
import useAccountData from './useAccountData';

export default () => {
  const { accountData } = useAccountData();

  const { totalDepositedUSD, totalBorrowedUSD } = useMemo<{
    totalDepositedUSD: BigNumber;
    totalBorrowedUSD: BigNumber;
  }>(() => {
    if (!accountData) return { totalDepositedUSD: Zero, totalBorrowedUSD: Zero };

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
        const WADDecimals = parseFixed('1', decimals);

        // iterate through fixed deposited pools to get totals
        const { fixedTotalDeposited } = fixedDepositPositions.reduce(
          (fixedPoolStats, pool) => {
            const { position } = pool;

            fixedPoolStats.fixedTotalDeposited = fixedPoolStats.fixedTotalDeposited.add(position.principal);
            return fixedPoolStats;
          },
          { fixedTotalDeposited: Zero },
        );

        // iterate through fixed borrowed pools to get totals
        const { fixedTotalBorrowed } = fixedBorrowPositions.reduce(
          (fixedPoolStats, pool) => {
            const { position } = pool;

            fixedPoolStats.fixedTotalBorrowed = fixedPoolStats.fixedTotalBorrowed.add(position.principal);
            return fixedPoolStats;
          },
          { fixedTotalBorrowed: Zero },
        );

        acc.depositedUSD = acc.depositedUSD.add(
          floatingDepositAssets.add(fixedTotalDeposited).mul(usdPrice).div(WADDecimals),
        );
        acc.borrowedUSD = acc.borrowedUSD.add(
          floatingBorrowAssets.add(fixedTotalBorrowed).mul(usdPrice).div(WADDecimals),
        );
        return acc;
      },
      { depositedUSD: Zero, borrowedUSD: Zero },
    );

    return { totalDepositedUSD: depositedUSD, totalBorrowedUSD: borrowedUSD };
  }, [accountData]);

  return { totalDepositedUSD, totalBorrowedUSD };
};
