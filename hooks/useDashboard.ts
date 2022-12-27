import { useContext, useMemo } from 'react';
import AccountDataContext from 'contexts/AccountDataContext';
import { FloatingPoolItemData } from 'types/FloatingPoolItemData';
import useAssets from './useAssets';
import { Previewer } from 'types/contracts';
import useFixedPools from './useFixedPools';

export default function useDashboard(type: string) {
  const { accountData } = useContext(AccountDataContext);
  const orderAssets = useAssets();
  const { deposits, borrows } = useFixedPools();
  const isDeposit = type === 'deposit';

  const defaultRows: FloatingPoolItemData[] = useMemo<FloatingPoolItemData[]>(
    () => orderAssets.map((s) => ({ symbol: s })),
    [orderAssets],
  );

  const floatingData = useMemo<FloatingPoolItemData[] | undefined>(() => {
    if (!accountData) return;

    const allMarkets = Object.values(accountData).sort(
      (a: Previewer.MarketAccountStructOutput, b: Previewer.MarketAccountStructOutput) => {
        return orderAssets.indexOf(a.assetSymbol) - orderAssets.indexOf(b.assetSymbol);
      },
    );

    return allMarkets.map(
      ({ assetSymbol, floatingDepositAssets, floatingDepositShares, floatingBorrowAssets, market }) => ({
        symbol: assetSymbol,
        exaTokens: floatingDepositShares,
        depositedAmount: floatingDepositAssets,
        borrowedAmount: floatingBorrowAssets,
        market,
      }),
    );
  }, [accountData, orderAssets]);

  const fixedDeposits = useMemo(() => {
    if (!deposits) return [];
    return Object.keys(deposits)?.flatMap((maturity) => deposits[maturity]);
  }, [deposits]);

  const fixedBorrows = useMemo(() => {
    if (!borrows) return [];
    return Object.keys(borrows)?.flatMap((maturity) => borrows[maturity]);
  }, [borrows]);

  const fixedRows = useMemo(() => (isDeposit ? fixedDeposits : fixedBorrows), [isDeposit, fixedDeposits, fixedBorrows]);

  return { floatingRows: floatingData || defaultRows, fixedRows };
}
