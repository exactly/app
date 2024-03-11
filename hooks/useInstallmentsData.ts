import { useCallback, useMemo } from 'react';
import { parseUnits } from 'viem';
import split from '@exactly/lib/esm/installments/split';
import fromAmounts from '@exactly/lib/esm/installments/fromAmounts';
import { fixedUtilization, globalUtilization } from 'utils/interestRateCurve';
import useAccountData from 'hooks/useAccountData';
import { INTERVAL } from 'utils/utils';
import useIRM from 'hooks/useIRM';

export default function useInstallmentsData({
  qty,
  date,
  symbol,
  installments,
}: {
  qty: string;
  date?: bigint;
  symbol: string;
  installments: number;
}) {
  const { marketAccount } = useAccountData(symbol);
  const irmParameters = useIRM(symbol);

  const getDetails = useCallback(
    (amount: bigint, installments_: bigint, firstMaturity: bigint) => {
      if (amount === 0n || irmParameters === undefined || marketAccount === undefined) return;
      const { floatingUtilization, floatingAssets, floatingDebt, floatingBackupBorrowed, fixedPools } = marketAccount;
      const fixedPoolsUtilizations = fixedPools
        .filter(({ maturity }) => maturity >= firstMaturity && maturity < firstMaturity + installments_ * INTERVAL)
        .map(({ supplied, borrowed }) => fixedUtilization(supplied, borrowed, floatingAssets));
      const timestamp = Math.round(Date.now() / 1000);
      const parameters = [
        floatingAssets,
        Number(firstMaturity),
        Number(installments_),
        fixedPoolsUtilizations,
        floatingUtilization,
        globalUtilization(floatingAssets, floatingDebt, floatingBackupBorrowed),
        irmParameters,
        timestamp,
      ] as const;
      const installmentsPrincipal = split(amount, ...parameters);
      const installmentsRepayAmount = fromAmounts(installmentsPrincipal, ...parameters);
      const totalPrincipal = installmentsPrincipal.reduce((acc, val) => acc + val, 0n);
      const maxRepay = installmentsRepayAmount.reduce((acc, val) => acc + val, 0n);
      const averageRepay = maxRepay / installments_;
      const maturities = installmentsPrincipal.map((_, index) => firstMaturity + BigInt(index) * INTERVAL);
      return {
        installmentsPrincipal,
        maturities,
        installmentsRepayAmount,
        totalPrincipal,
        maxRepay,
        averageRepay,
      };
    },
    [irmParameters, marketAccount],
  );

  const installmentsOptions = useMemo(() => {
    if (!marketAccount || !date) return undefined;
    const { decimals, maxFuturePools, fixedPools } = marketAccount;
    const amount = parseUnits(qty, decimals);
    const lastPool = fixedPools.map(({ maturity }) => maturity).sort((a, b) => (a > b ? -1 : 1))[0];
    return new Array(maxFuturePools).fill(0).map((_, index) => {
      const installmentsCount = BigInt(index + 1);
      const endDate = date + (installmentsCount - 1n) * INTERVAL;
      const last = endDate > lastPool ? lastPool : endDate;
      const startingDate = last - (installmentsCount - 1n) * INTERVAL;
      const details = getDetails(amount, installmentsCount, startingDate);
      return {
        installments: Number(installmentsCount),
        repayAmount: amount === 0n || details === undefined ? 0n : details.averageRepay,
        startingDate,
      };
    });
  }, [date, marketAccount, qty, getDetails]);

  const installmentsDetails = useMemo(() => {
    if (!marketAccount || !date) return undefined;
    const { decimals } = marketAccount;
    const amount = parseUnits(qty, decimals);
    return getDetails(amount, BigInt(installments), date);
  }, [date, getDetails, installments, marketAccount, qty]);

  return { installmentsOptions, installmentsDetails };
}
