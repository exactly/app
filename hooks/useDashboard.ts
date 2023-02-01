import { useCallback, useContext, useMemo } from 'react';
import AccountDataContext from 'contexts/AccountDataContext';
import { FloatingPoolItemData } from 'types/FloatingPoolItemData';
import useAssets from './useAssets';
import { Previewer } from 'types/contracts';
import useFixedPools from './useFixedPools';
import { BigNumber, formatFixed } from '@ethersproject/bignumber';

export default function useDashboard(type: string) {
  const { accountData } = useContext(AccountDataContext);
  const orderAssets = useAssets();
  const { deposits, borrows } = useFixedPools();
  const isDeposit = type === 'deposit';

  const defaultRows: FloatingPoolItemData[] = useMemo<FloatingPoolItemData[]>(
    () => orderAssets.map((s) => ({ symbol: s })),
    [orderAssets],
  );

  const getValueInUSD = useCallback(
    (symbol: string, amount: BigNumber): number => {
      const { decimals, usdPrice } = accountData?.[symbol] ?? {};
      if (!decimals || !usdPrice) return 0;

      const rate = parseFloat(formatFixed(usdPrice, 18));
      return parseFloat(formatFixed(amount, decimals)) * rate;
    },
    [accountData],
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
        valueUSD: getValueInUSD(assetSymbol, isDeposit ? floatingDepositAssets : floatingBorrowAssets),
        market,
      }),
    );
  }, [accountData, orderAssets, getValueInUSD, isDeposit]);

  const fixedDeposits = useMemo(() => {
    if (!deposits) return [];
    return Object.keys(deposits)?.flatMap((maturity) => deposits[parseInt(maturity)]);
  }, [deposits]);

  const fixedBorrows = useMemo(() => {
    if (!borrows) return [];
    return Object.keys(borrows)?.flatMap((maturity) => borrows[parseInt(maturity)]);
  }, [borrows]);

  const fixedRows = useMemo(() => {
    const fixedData = isDeposit ? fixedDeposits : fixedBorrows;
    return fixedData.map((pool) => ({ ...pool, valueUSD: getValueInUSD(pool.symbol, pool.previewValue) }));
  }, [isDeposit, fixedDeposits, fixedBorrows, getValueInUSD]);

  return { floatingRows: floatingData || defaultRows, fixedRows };
}
