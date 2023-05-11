import { formatFixed } from '@ethersproject/bignumber';
import { WeiPerEther } from '@ethersproject/constants';
import { useMemo } from 'react';

import formatNumber from 'utils/formatNumber';

import useAccountData from './useAccountData';

type APRsPerMaturityType = Record<string, { borrow: number; deposit: number }>;

type TableRow = {
  maturity: number;
  totalDeposited: string;
  totalBorrowed: string;
  depositAPR: number;
  borrowAPR: number;
};

export default function useMaturityPools(symbol: string): TableRow[] {
  const { marketAccount } = useAccountData(symbol);
  return useMemo(() => {
    if (!marketAccount) return [];

    const { fixedPools, usdPrice, decimals } = marketAccount;

    const APRsPerMaturity: APRsPerMaturityType = Object.fromEntries(
      fixedPools.map(({ maturity, depositRate, minBorrowRate }) => [
        maturity,
        { borrow: Number(minBorrowRate.toBigInt()) / 1e18, deposit: Number(depositRate.toBigInt()) / 1e18 },
      ]),
    );

    return fixedPools.map(({ maturity, borrowed, supplied }) => {
      const maturityKey = maturity.toString();
      const totalDeposited = formatNumber(formatFixed(supplied.mul(usdPrice).div(WeiPerEther), decimals));
      const totalBorrowed = formatNumber(formatFixed(borrowed.mul(usdPrice).div(WeiPerEther), decimals));

      return {
        maturity: maturity.toNumber(),
        totalDeposited,
        totalBorrowed,
        depositAPR: APRsPerMaturity[maturityKey]?.deposit,
        borrowAPR: APRsPerMaturity[maturityKey]?.borrow,
      };
    });
  }, [marketAccount]);
}
