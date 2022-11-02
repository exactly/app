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
  bestDepositAPR?: number;
  bestDepositAPRTimestamp?: number;
  bestBorrowAPR?: number;
  bestBorrowAPRTimestamp?: number;
};

const MaturityPoolInfo: FC<MaturityPoolInfoProps> = ({
  totalDeposited,
  totalBorrowed,
  bestDepositAPR,
  bestDepositAPRTimestamp,
  bestBorrowAPR,
  bestBorrowAPRTimestamp,
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
      label: translations[lang].bestDepositAPR,
      value: toPercentage(bestDepositAPR && bestDepositAPR > minAPRValue ? bestDepositAPR : undefined),
      underLabel: bestDepositAPRTimestamp ? parseTimestamp(bestDepositAPRTimestamp) : undefined,
      tooltip: 'The highest fixed interest rate APR for a $1 deposit in all the available Fixed Rated Pools.',
    },
    {
      label: translations[lang].bestBorrowAPR,
      value: toPercentage(bestBorrowAPR && bestBorrowAPR > minAPRValue ? bestBorrowAPR : undefined),
      underLabel: bestBorrowAPRTimestamp ? parseTimestamp(bestBorrowAPRTimestamp) : undefined,
      tooltip: 'The lowest fixed interest rate APR for a $1 borrow in all the available Fixed Rated Pools.',
    },
  ];

  return (
    <Grid container>
      <HeaderInfo title={translations[lang].maturityPools} itemsInfo={itemsInfo} variant="h5" />
    </Grid>
  );
};

export default MaturityPoolInfo;
