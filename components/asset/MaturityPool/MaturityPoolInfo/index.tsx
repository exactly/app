import React, { FC, useMemo } from 'react';
import Grid from '@mui/material/Grid';

import formatNumber from 'utils/formatNumber';
import HeaderInfo from 'components/common/HeaderInfo';
import { ItemInfoProps } from 'components/common/ItemInfo';
import { toPercentage } from 'utils/utils';

import numbers from 'config/numbers.json';
import parseTimestamp from 'utils/parseTimestamp';
import useRewards from 'hooks/useRewards';
import { Zero } from '@ethersproject/constants';
import ItemCell from 'components/common/ItemCell';

type MaturityPoolInfoProps = {
  symbol: string;
  totalDeposited?: number;
  totalBorrowed?: number;
  bestDepositRate?: number;
  bestDepositMaturity?: number;
  bestBorrowRate?: number;
  bestBorrowMaturity?: number;
};

const MaturityPoolInfo: FC<MaturityPoolInfoProps> = ({
  symbol,
  totalDeposited,
  totalBorrowed,
  bestDepositRate,
  bestDepositMaturity,
  bestBorrowRate,
  bestBorrowMaturity,
}) => {
  const { minAPRValue } = numbers;

  const { rates } = useRewards();

  const itemsInfo: ItemInfoProps[] = useMemo(
    () => [
      {
        label: 'Total Deposits',
        value: totalDeposited !== undefined ? `$${formatNumber(totalDeposited)}` : undefined,
      },
      {
        label: 'Total Borrows',
        value: totalBorrowed !== undefined ? `$${formatNumber(totalBorrowed)}` : undefined,
      },
      {
        label: 'Best Deposit APR',
        value: toPercentage(bestDepositRate && bestDepositRate > minAPRValue ? bestDepositRate : undefined),
        underLabel: bestDepositMaturity ? parseTimestamp(bestDepositMaturity) : undefined,
        tooltipTitle: 'The highest fixed Interest rate for a deposit up to de optimal deposit size.',
      },
      {
        label: 'Best Borrow APR',
        value: toPercentage(bestBorrowRate && bestBorrowRate > minAPRValue ? bestBorrowRate : undefined),
        underLabel: bestBorrowMaturity ? parseTimestamp(bestBorrowMaturity) : undefined,
        tooltipTitle: 'The lowest fixed Borrowing Interest rate (APR) at current utilization levels.',
      },
      ...(rates[symbol] && rates[symbol].some((r) => r.borrow.gt(Zero))
        ? [
            {
              label: 'Borrow Rewards',
              value: (
                <>
                  {rates[symbol].map((r) => (
                    <ItemCell key={r.asset} value={toPercentage(Number(r.borrow) / 1e18)} symbol={r.assetSymbol} />
                  ))}
                </>
              ),
              tooltipTitle: 'This APR assumes a constant price for the OP tokens and distribution rate.',
            },
          ]
        : []),
    ],
    [
      bestBorrowMaturity,
      bestBorrowRate,
      bestDepositMaturity,
      bestDepositRate,
      minAPRValue,
      rates,
      symbol,
      totalBorrowed,
      totalDeposited,
    ],
  );

  return (
    <Grid container>
      <HeaderInfo title="Fixed Interest Rate" itemsInfo={itemsInfo} shadow={false} xs={itemsInfo.length > 4 ? 4 : 6} />
    </Grid>
  );
};

export default MaturityPoolInfo;
