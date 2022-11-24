import AccountDataContext from 'contexts/AccountDataContext';
import { useCallback, useContext, useEffect, useState } from 'react';
import { FixedLenderAccountData } from 'types/FixedLenderAccountData';
import { MaturityPool } from 'types/MaturityPool';

export default () => {
  const { accountData } = useContext(AccountDataContext);
  const [deposits, setDeposits] = useState<MaturityPool>();
  const [borrows, setBorrows] = useState<MaturityPool>();

  const getMaturityPools = useCallback(async () => {
    if (!accountData) return;
    const data: Record<string, MaturityPool> = {};

    Object.values(accountData).forEach((asset: FixedLenderAccountData) => {
      asset.fixedDepositPositions.forEach((pool) => {
        const date = pool.maturity.toNumber().toString();
        data.deposits = data.deposits ?? {};

        data.deposits[date] = data.deposits[date]
          ? [
              ...data.deposits[date],
              {
                maturity: date,
                symbol: asset.assetSymbol,
                market: asset.market,
                fee: pool.position.fee,
                principal: pool.position.principal,
                decimals: asset.decimals,
              },
            ]
          : [
              {
                maturity: date,
                symbol: asset.assetSymbol,
                market: asset.market,
                fee: pool.position.fee,
                principal: pool.position.principal,
                decimals: asset.decimals,
              },
            ];
      });

      asset.fixedBorrowPositions.forEach((pool) => {
        const date = pool.maturity.toNumber().toString();
        data.borrows = data.borrows ?? {};

        data.borrows[date] = data.borrows[date]
          ? [
              ...data.borrows[date],
              {
                maturity: date,
                symbol: asset.assetSymbol,
                market: asset.market,
                fee: pool.position.fee,
                principal: pool.position.principal,
                decimals: asset.decimals,
              },
            ]
          : [
              {
                maturity: date,
                symbol: asset.assetSymbol,
                market: asset.market,
                fee: pool.position.fee,
                principal: pool.position.principal,
                decimals: asset.decimals,
              },
            ];
      });
    });

    setDeposits(data.deposits);
    setBorrows(data.borrows);
  }, [accountData]);

  useEffect(() => {
    getMaturityPools();
  }, [accountData, getMaturityPools]);

  return { deposits, borrows };
};
