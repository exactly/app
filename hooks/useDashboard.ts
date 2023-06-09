import { useCallback, useEffect, useMemo, useState } from 'react';
import { FloatingPoolItemData } from 'types/FloatingPoolItemData';
import useAssets from './useAssets';
import { useWeb3 } from 'hooks/useWeb3';
import useFixedPools from './useFixedPools';
import useAccountData, { MarketAccount } from './useAccountData';
import getFloatingDepositAPR from 'utils/getFloatingDepositAPR';
import { useGlobalError } from 'contexts/GlobalErrorContext';
import { formatUnits } from 'viem';

export default function useDashboard(type: string) {
  const { accountData, getMarketAccount } = useAccountData();
  const orderAssets = useAssets();
  const { chain } = useWeb3();
  const { deposits, borrows } = useFixedPools();
  const { setIndexerError } = useGlobalError();
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
            ? await getFloatingDepositAPR(chain.id, 'deposit', maxFuturePools, market).catch(() => {
                setIndexerError();
                return undefined;
              })
            : Number(floatingBorrowRate) / 1e18;

          return {
            symbol: assetSymbol,
            depositedAmount: floatingDepositAssets,
            borrowedAmount: floatingBorrowAssets,
            apr,
            valueUSD: getValueInUSD(assetSymbol, isDeposit ? floatingDepositAssets : floatingBorrowAssets),
            market,
          };
        },
      ),
    );
  }, [accountData, chain.id, getValueInUSD, isDeposit, orderAssets, setIndexerError]);

  useEffect(() => {
    const fetchData = async () => {
      const asyncData = await getFloatingData();
      setFloatingData(asyncData);
    };

    fetchData();
  }, [getFloatingData]);

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
