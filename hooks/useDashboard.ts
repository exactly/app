import { useCallback, useEffect, useMemo, useState } from 'react';
import { FloatingPoolItemData } from 'types/FloatingPoolItemData';
import useAssets from './useAssets';
import { useWeb3 } from 'hooks/useWeb3';
import useFixedPools from './useFixedPools';
import useAccountData, { MarketAccount } from './useAccountData';
import getFloatingDepositAPR from 'utils/getFloatingDepositAPR';
import { useGlobalError } from 'contexts/GlobalErrorContext';
import { formatUnits, parseEther } from 'viem';
import { useCustomTheme } from 'contexts/ThemeContext';

export default function useDashboard(type: 'deposit' | 'borrow') {
  const { accountData, getMarketAccount } = useAccountData();
  const orderAssets = useAssets();
  const { chain } = useWeb3();
  const { deposits, borrows } = useFixedPools();
  const { setIndexerError } = useGlobalError();
  const { aprToAPY } = useCustomTheme();
  const isDeposit = type === 'deposit';

  const defaultRows: FloatingPoolItemData[] = useMemo<FloatingPoolItemData[]>(
    () => orderAssets.map((s) => ({ symbol: s })),
    [orderAssets],
  );

  const [floatingData, setFloatingData] = useState<FloatingPoolItemData[] | undefined>(defaultRows);

  const getValueInUSD = useCallback(
    (symbol: string, amount: bigint): number => {
      const { decimals, usdPrice } = getMarketAccount(symbol) ?? {};
      if (!decimals || !usdPrice) return 0;
      const usd = (amount * usdPrice) / 10n ** BigInt(decimals);
      return parseFloat(formatUnits(usd, 18));
    },
    [getMarketAccount],
  );

  const getFloatingData = useCallback(async (): Promise<FloatingPoolItemData[] | undefined> => {
    if (!accountData) return;

    const allMarkets = Object.values(accountData).sort((a: MarketAccount, b: MarketAccount) => {
      return orderAssets.indexOf(a.assetSymbol) - orderAssets.indexOf(b.assetSymbol);
    });

    return await Promise.all(
      allMarkets.map(
        async ({
          assetSymbol,
          floatingDepositAssets,
          floatingBorrowAssets,
          market,
          maxFuturePools,
          floatingBorrowRate,
        }) => {
          const apr = isDeposit
            ? parseEther(
                String(
                  (await getFloatingDepositAPR(chain.id, 'deposit', maxFuturePools, market).catch(() => {
                    setIndexerError();
                    return undefined;
                  })) || 0,
                ),
              )
            : floatingBorrowRate;

          return {
            symbol: assetSymbol,
            depositedAmount: floatingDepositAssets,
            borrowedAmount: floatingBorrowAssets,
            apr: Number(aprToAPY(apr)) / 1e18,
            valueUSD: getValueInUSD(assetSymbol, isDeposit ? floatingDepositAssets : floatingBorrowAssets),
            market,
          };
        },
      ),
    );
  }, [accountData, aprToAPY, chain.id, getValueInUSD, isDeposit, orderAssets, setIndexerError]);

  useEffect(() => {
    const fetchData = async () => {
      const asyncData = await getFloatingData();
      setFloatingData(asyncData);
    };

    fetchData();
  }, [getFloatingData]);

  const fixedRows = useMemo(() => {
    const fixedData = isDeposit ? deposits : borrows;
    const flat = Object.values(fixedData).flatMap((x) => x);
    return flat.map((pool) => ({ ...pool, valueUSD: getValueInUSD(pool.symbol, pool.previewValue) }));
  }, [isDeposit, deposits, borrows, getValueInUSD]);

  return { floatingRows: floatingData || defaultRows, fixedRows };
}
