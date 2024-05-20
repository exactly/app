import { useCallback, useMemo } from 'react';
import { parseUnits } from 'viem';
import splitInstallments from '@exactly/lib/esm/installments/split';
import fixedUtilization from '@exactly/lib/esm/interest-rate-model/fixedUtilization';
import globalUtilization from '@exactly/lib/esm/interest-rate-model/globalUtilization';
import useAccountData from 'hooks/useAccountData';
import { INTERVAL } from 'utils/utils';
import useIRM from 'hooks/useIRM';
import { Operation } from 'types/Operation';

export default function useInstallmentsData({
  operation,
  qty,
  date,
  symbol,
  installments,
}: {
  operation: Operation;
  qty: string;
  date?: bigint;
  symbol: string;
  installments: number;
}) {
  const { marketAccount } = useAccountData(symbol);
  const irmParameters = useIRM(symbol);

  const getDetails = useCallback(
    (amount: bigint, installments_: bigint, firstMaturity: bigint) => {
      if (
        amount === 0n ||
        irmParameters === undefined ||
        marketAccount === undefined ||
        operation !== 'borrowAtMaturity'
      )
        return;
      const {
        floatingUtilization,
        totalFloatingBorrowAssets,
        totalFloatingDepositAssets,
        floatingBackupBorrowed,
        fixedPools,
      } = marketAccount;
      const timestamp = Math.round(Date.now() / 1000);
      const {
        amounts: installmentsPrincipal,
        installments: installmentsRepayAmount,
        effectiveRate,
      } = splitInstallments(
        amount,
        totalFloatingDepositAssets,
        Number(firstMaturity),
        fixedPools.length,
        fixedPools
          .filter(({ maturity }) => maturity >= firstMaturity && maturity < firstMaturity + installments_ * INTERVAL)
          .map(({ supplied, borrowed }) => fixedUtilization(supplied, borrowed, totalFloatingDepositAssets)),
        floatingUtilization,
        globalUtilization(totalFloatingDepositAssets, totalFloatingBorrowAssets, floatingBackupBorrowed),
        irmParameters,
        timestamp,
        { rateTolerance: 10n ** 15n },
      );
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
        effectiveRate,
      };
    },
    [irmParameters, marketAccount, operation],
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
