import { formatFixed } from '@ethersproject/bignumber';
import { WeiPerEther } from '@ethersproject/constants';
import { useContext, useMemo } from 'react';

import formatNumber from 'utils/formatNumber';

import AccountDataContext from 'contexts/AccountDataContext';

type APRsPerMaturityType = Record<string, { borrow: number; deposit: number }>;

type TableRow = {
  maturity: number;
  totalDeposited: string;
  totalBorrowed: string;
  depositAPR: number;
  borrowAPR: number;
};

export default function useMaturityPools(symbol: string) {
  const { accountData } = useContext(AccountDataContext);
  return useMemo(() => {
    if (!accountData) return [];

    const { fixedPools, usdPrice, decimals } = accountData[symbol];

    const APRsPerMaturity: APRsPerMaturityType = Object.fromEntries(
      fixedPools.map(({ maturity, depositRate, minBorrowRate }) => [
        maturity,
        { borrow: Number(minBorrowRate.toBigInt()) / 1e18, deposit: Number(depositRate.toBigInt()) / 1e18 },
      ]),
    );

    const tempRows: TableRow[] = [];
    fixedPools.forEach(({ maturity, borrowed, supplied }) => {
      const maturityKey = maturity.toString();

      const totalDeposited = formatNumber(formatFixed(supplied.mul(usdPrice).div(WeiPerEther), decimals));
      const totalBorrowed = formatNumber(formatFixed(borrowed.mul(usdPrice).div(WeiPerEther), decimals));

      tempRows.push({
        maturity: maturity.toNumber(),
        totalDeposited,
        totalBorrowed,
        depositAPR: APRsPerMaturity[maturityKey]?.deposit,
        borrowAPR: APRsPerMaturity[maturityKey]?.borrow,
      });
    });

    return tempRows;
  }, [accountData, symbol]);
}
