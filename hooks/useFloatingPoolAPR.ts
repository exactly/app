import { useMemo } from 'react';
import { parseUnits } from 'viem';
import { WAD, floatingRate, floatingUtilization, globalUtilization } from '@exactly/lib';

import type { Operation } from 'types/Operation';
import useAccountData from './useAccountData';
import useIRM from './useIRM';
import useFloatingDepositRates from './useFloatingDepositRates';

type FloatingPoolAPR = {
  depositAPR: number | undefined;
  borrowAPR: number | undefined;
  loading: boolean;
};

export default (
  symbol: string,
  qty?: string,
  operation?: Extract<Operation, 'deposit' | 'borrow'>,
): FloatingPoolAPR => {
  const { marketAccount } = useAccountData(symbol);
  const { data: depositAPRs, isLoading } = useFloatingDepositRates(operation !== 'borrow');

  const irm = useIRM(symbol);

  const borrowAPR = useMemo((): number | undefined => {
    if (!marketAccount || !irm || operation === 'deposit') {
      return undefined;
    }

    const { totalFloatingDepositAssets, totalFloatingBorrowAssets, decimals, floatingBackupBorrowed } = marketAccount;
    const delta = parseUnits(qty || '0', decimals);

    const debt = totalFloatingBorrowAssets + delta;

    return (
      Number(
        floatingRate(
          floatingUtilization(totalFloatingDepositAssets, debt),
          globalUtilization(totalFloatingDepositAssets, debt, floatingBackupBorrowed),
          irm,
        ),
      ) / 1e18
    );
  }, [marketAccount, irm, operation, qty]);

  const depositAPR = useMemo((): number | undefined => {
    if (operation === 'borrow' || !marketAccount) return undefined;

    const depositAPRRate = depositAPRs?.[marketAccount.market.toLowerCase()];
    if (depositAPRRate === undefined) return undefined;

    const { totalFloatingDepositAssets, decimals } = marketAccount;
    const futureSupply = totalFloatingDepositAssets + parseUnits(qty || '0', decimals);
    const ratio = Number(futureSupply === 0n ? 0n : (totalFloatingDepositAssets * WAD) / futureSupply) / 1e18;

    return ratio * depositAPRRate;
  }, [operation, marketAccount, depositAPRs, qty]);

  return {
    depositAPR,
    borrowAPR,
    loading: operation === 'borrow' ? false : !marketAccount || isLoading,
  };
};
