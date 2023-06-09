import { useMemo } from 'react';
import { formatUnits } from 'viem';
import { WEI_PER_ETHER } from 'utils/const';

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
  return useMemo<TableRow[]>(() => {
    if (!marketAccount) return [];

    const { fixedPools, usdPrice, decimals } = marketAccount;

    const APRsPerMaturity: APRsPerMaturityType = Object.fromEntries(
      fixedPools.map(({ maturity, depositRate, minBorrowRate }) => [
        maturity,
        { borrow: Number(minBorrowRate) / 1e18, deposit: Number(depositRate) / 1e18 },
      ]),
    );

    return fixedPools.map(({ maturity, borrowed, supplied }) => {
      const maturityKey = maturity.toString();

      const totalDeposited = formatNumber(formatUnits((supplied * usdPrice) / WEI_PER_ETHER, decimals));
      const totalBorrowed = formatNumber(formatUnits((borrowed * usdPrice) / WEI_PER_ETHER, decimals));

      return {
        maturity: Number(maturity),
        totalDeposited,
        totalBorrowed,
        depositAPR: APRsPerMaturity[maturityKey]?.deposit,
        borrowAPR: APRsPerMaturity[maturityKey]?.borrow,
      };
    });
  }, [marketAccount]);
}
