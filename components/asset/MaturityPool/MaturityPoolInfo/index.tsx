import React, { FC, useContext } from 'react';
import Grid from '@mui/material/Grid';

import LangContext from 'contexts/LangContext';

import { PoolItemInfoProps } from 'components/asset/PoolItemInfo';
import PoolHeaderInfo from 'components/asset/PoolHeaderInfo';

import { LangKeys } from 'types/Lang';

import keys from './translations.json';

import formatNumber from 'utils/formatNumber';

type MaturityPoolInfoProps = {
  totalDeposited?: number;
  totalBorrowed?: number;
  bestDepositAPR?: string;
  bestDepositAPRDate?: string;
  bestBorrowAPR?: string;
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

  const itemsInfo: PoolItemInfoProps[] = [
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
      value: bestDepositAPR ?? undefined,
      underLabel: bestDepositAPRDate ?? undefined,
    },
    {
      label: translations[lang].bestBorrowAPR,
      value: bestBorrowAPR ?? undefined,
      underLabel: bestBorrowAPRDate ?? undefined,
    },
  ];

  return (
    <Grid container>
      <PoolHeaderInfo title={translations[lang].maturityPools} itemsInfo={itemsInfo} />
    </Grid>
  );
};

export default MaturityPoolInfo;
