import React, { FC, useContext } from 'react';
import Grid from '@mui/material/Grid';

import LangContext from 'contexts/LangContext';

import { LangKeys } from 'types/Lang';

import keys from './translations.json';

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
  const lang: string = useContext(LangContext);
  const translations: { [key: string]: LangKeys } = keys;

  const { minAPRValue } = numbers;

  const itemsInfo: ItemInfoProps[] = [
    {
      label: translations[lang].totalDeposited,
      value: totalDeposited != null ? `$${formatNumber(totalDeposited)}` : undefined,
    },
    {
      label: translations[lang].totalBorrowed,
      value: totalBorrowed != null ? `$${formatNumber(totalBorrowed)}` : undefined,
    },
    {
      label: translations[lang].bestDepositRate,
      value: toPercentage(bestDepositRate && bestDepositRate > minAPRValue ? bestDepositRate : undefined),
      underLabel: bestDepositMaturity ? parseTimestamp(bestDepositMaturity) : undefined,
      tooltipTitle: 'The highest fixed interest rate APR for a $1 deposit in all the available Fixed Rated Pools.',
    },
    {
      label: translations[lang].bestBorrowRate,
      value: toPercentage(bestBorrowRate && bestBorrowRate > minAPRValue ? bestBorrowRate : undefined),
      underLabel: bestBorrowMaturity ? parseTimestamp(bestBorrowMaturity) : undefined,
      tooltipTitle: 'The lowest fixed interest rate APR for a $1 borrow in all the available Fixed Rated Pools.',
    },
  ];

  return (
    <Grid container>
      <HeaderInfo title="Fixed Interest Rate" itemsInfo={itemsInfo} shadow={false} />
    </Grid>
  );
};

export default MaturityPoolInfo;
