import { useMemo } from 'react';
import { FixedPool, Pool } from 'types/FixedPool';
import useAccountData from './useAccountData';

export default () => {
  const { accountData } = useAccountData();

  const fixedPools = useMemo(() => {
    const data = { deposits: {} as FixedPool, borrows: {} as FixedPool };
    if (!accountData) return data;

    accountData.forEach((asset) => {
      asset.fixedDepositPositions.forEach((pool) => {
        const date = pool.maturity;
        const entry: Pool = {
          maturity: date,
          symbol: asset.assetSymbol,
          market: asset.market,
          fee: pool.position.fee,
          decimals: asset.decimals,
          previewValue: pool.previewValue,
        };

        data.deposits[String(date)] = data.deposits[String(date)] ? [...data.deposits[String(date)], entry] : [entry];
      });

      asset.fixedBorrowPositions.forEach((pool) => {
        const date = pool.maturity;
        const entry: Pool = {
          maturity: date,
          symbol: asset.assetSymbol,
          market: asset.market,
          fee: pool.position.fee,
          decimals: asset.decimals,
          previewValue: pool.previewValue,
        };

        data.borrows[String(date)] = data.borrows[String(date)] ? [...data.borrows[String(date)], entry] : [entry];
      });
    });

    return data;
  }, [accountData]);

  return fixedPools;
};
