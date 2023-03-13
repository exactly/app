import React, { FC } from 'react';
import Grid from '@mui/material/Grid';

import formatNumber from 'utils/formatNumber';
import HeaderInfo from 'components/common/HeaderInfo';
import { ItemInfoProps } from 'components/common/ItemInfo';
import { toPercentage } from 'utils/utils';

import numbers from 'config/numbers.json';
import parseTimestamp from 'utils/parseTimestamp';

type MaturityPoolInfoProps = {
  totalDeposited?: number;
  totalBorrowed?: number;
  bestDepositRate?: number;
  bestDepositMaturity?: number;
  bestBorrowRate?: number;
  bestBorrowMaturity?: number;
};

const MaturityPoolInfo: FC<MaturityPoolInfoProps> = ({
  totalDeposited,
  totalBorrowed,
  bestDepositRate,
  bestDepositMaturity,
  bestBorrowRate,
  bestBorrowMaturity,
}) => {
  const { minAPRValue } = numbers;

  const itemsInfo: ItemInfoProps[] = [
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
  ];

  return (
    <Grid container>
      <HeaderInfo title="Fixed Interest Rate" itemsInfo={itemsInfo} shadow={false} xs={6} />
    </Grid>
  );
};

export default MaturityPoolInfo;
