import { useCallback, useMemo } from 'react';
import { FloatingPoolItemData } from 'types/FloatingPoolItemData';
import useAssets from './useAssets';
import useFixedPools from './useFixedPools';
import usePreviewerExactly, { type MarketAccount } from './usePreviewerExactly';
import { formatUnits } from 'viem';
import useFloatingDepositRates from './useFloatingDepositRates';

export default function useDashboard(type: 'deposit' | 'borrow') {
  const { data: accountData } = usePreviewerExactly();
  const orderAssets = useAssets();
  const { deposits, borrows } = useFixedPools();
  const isDeposit = type === 'deposit';
  const { data: depositAPRs, isLoading: depositAPRsLoading } = useFloatingDepositRates(isDeposit);

  const defaultRows: FloatingPoolItemData[] = useMemo<FloatingPoolItemData[]>(
    () => orderAssets.map((s) => ({ symbol: s })),
    [orderAssets],
  );

  const getValueInUSD = useCallback(
    (symbol: string, amount: bigint): number => {
      const { decimals, usdPrice } = accountData?.find((market) => market.assetSymbol === symbol) ?? {};
      if (!decimals || !usdPrice) return 0;
      const usd = (amount * usdPrice) / 10n ** BigInt(decimals);
      return parseFloat(formatUnits(usd, 18));
    },
    [accountData],
  );

  const floatingData = useMemo<FloatingPoolItemData[] | undefined>(() => {
    if (!accountData || (isDeposit && depositAPRsLoading)) return;

    const allMarkets = Object.values(accountData)
      .filter((market: MarketAccount) => {
        const amount = isDeposit ? market.floatingDepositAssets : market.floatingBorrowAssets;
        return amount > 0n;
      })
      .sort((a: MarketAccount, b: MarketAccount) => {
        return orderAssets.indexOf(a.assetSymbol) - orderAssets.indexOf(b.assetSymbol);
      });

    return allMarkets.map(
      ({ assetSymbol, floatingDepositAssets, floatingBorrowAssets, market, floatingBorrowRate }) => {
        const apr = isDeposit ? depositAPRs?.[market.toLowerCase()] : Number(floatingBorrowRate) / 1e18;

        return {
          symbol: assetSymbol,
          depositedAmount: floatingDepositAssets,
          borrowedAmount: floatingBorrowAssets,
          apr,
          valueUSD: getValueInUSD(assetSymbol, isDeposit ? floatingDepositAssets : floatingBorrowAssets),
          market,
        };
      },
    );
  }, [accountData, depositAPRs, depositAPRsLoading, getValueInUSD, isDeposit, orderAssets]);

  const fixedRows = useMemo(() => {
    const fixedData = isDeposit ? deposits : borrows;
    const flat = Object.values(fixedData).flatMap((x) => x);
    return flat.map((pool) => ({ ...pool, valueUSD: getValueInUSD(pool.symbol, pool.previewValue) }));
  }, [isDeposit, deposits, borrows, getValueInUSD]);

  return { floatingRows: floatingData || defaultRows, fixedRows };
}
