import { useCallback, useEffect, useMemo, useState } from 'react';
import { FloatingPoolItemData } from 'types/FloatingPoolItemData';
import useAssets from './useAssets';
import { useWeb3 } from 'hooks/useWeb3';
import { Previewer } from 'types/contracts';
import useFixedPools from './useFixedPools';
import { BigNumber, formatFixed } from '@ethersproject/bignumber';
import useAccountData from './useAccountData';
import getFloatingDepositAPR from 'utils/getFloatingDepositAPR';

export default function useDashboard(type: string) {
  const { accountData, getMarketAccount } = useAccountData();
  const orderAssets = useAssets();
  const { chain } = useWeb3();
  const { deposits, borrows } = useFixedPools();
  const isDeposit = type === 'deposit';

  const defaultRows: FloatingPoolItemData[] = useMemo<FloatingPoolItemData[]>(
    () => orderAssets.map((s) => ({ symbol: s })),
    [orderAssets],
  );

  const [floatingData, setFloatingData] = useState<FloatingPoolItemData[] | undefined>(defaultRows);

  const getValueInUSD = useCallback(
    (symbol: string, amount: BigNumber): number => {
      const { decimals, usdPrice } = getMarketAccount(symbol) ?? {};
      if (!decimals || !usdPrice) return 0;

      const rate = parseFloat(formatFixed(usdPrice, 18));
      return parseFloat(formatFixed(amount, decimals)) * rate;
    },
    [getMarketAccount],
  );

  const getFloatingData = useCallback(async (): Promise<FloatingPoolItemData[] | undefined> => {
    if (!accountData) return;

    const allMarkets = Object.values(accountData).sort(
      (a: Previewer.MarketAccountStructOutput, b: Previewer.MarketAccountStructOutput) => {
        return orderAssets.indexOf(a.assetSymbol) - orderAssets.indexOf(b.assetSymbol);
      },
    );

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
            ? await getFloatingDepositAPR(chain.id, 'deposit', maxFuturePools, market)
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
  }, [accountData, chain.id, getValueInUSD, isDeposit, orderAssets]);

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
