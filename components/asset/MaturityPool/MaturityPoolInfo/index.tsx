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

type MaturityPoolInfoProps = {
  totalDeposited?: number;
  totalBorrowed?: number;
  bestDepositAPR?: number;
  bestDepositAPRDate?: string;
  bestBorrowAPR?: number;
  bestBorrowAPRDate?: string;
};

const MaturityPoolInfo: FC<MaturityPoolInfoProps> = ({
  totalDeposited,
  totalBorrowed,
  bestDepositAPR,
  bestDepositAPRDate,
  bestBorrowAPR,
  bestBorrowAPRDate,
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
      underLabel: bestDepositAPRDate ?? undefined,
    },
    {
      label: translations[lang].bestBorrowAPR,
      value: toPercentage(bestBorrowAPR && bestBorrowAPR > minAPRValue ? bestBorrowAPR : undefined),
      underLabel: bestBorrowAPRDate ?? undefined,
    },
  ];

  return (
    <Grid container>
      <HeaderInfo title={translations[lang].maturityPools} itemsInfo={itemsInfo} />
    </Grid>
  );
};

export default MaturityPoolInfo;
