import { useMemo } from 'react';
import { FixedPool, Pool } from 'types/FixedPool';
import useAccountData from './useAccountData';

export default () => {
  const { accountData } = useAccountData();

  const fixedPools = useMemo(() => {
    const data: Record<string, FixedPool> = { deposits: {}, borrows: {} };
    if (!accountData) return data;

    accountData.forEach((asset) => {
      asset.fixedDepositPositions.forEach((pool) => {
        const date = Number(pool.maturity);
        const entry: Pool = {
          maturity: date,
          symbol: asset.assetSymbol,
          market: asset.market,
          fee: pool.position.fee,
          decimals: asset.decimals,
          previewValue: pool.previewValue,
        };

        data.deposits[date] = data.deposits[date] ? [...data.deposits[date], entry] : [entry];
      });

      asset.fixedBorrowPositions.forEach((pool) => {
        const date = Number(pool.maturity);
        const entry: Pool = {
          maturity: date,
          symbol: asset.assetSymbol,
          market: asset.market,
          fee: pool.position.fee,
          decimals: asset.decimals,
          previewValue: pool.previewValue,
        };

        data.borrows[date] = data.borrows[date] ? [...data.borrows[date], entry] : [entry];
      });
    });

    return data;
  }, [accountData]);

  return fixedPools;
};
