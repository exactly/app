import { FC, useCallback, useContext, useEffect, useState } from 'react';
import { formatEther, formatUnits } from '@ethersproject/units';
import Grid from '@mui/material/Grid';
import Typography from '@mui/material/Typography';

import LangContext from 'contexts/LangContext';
import AccountDataContext from 'contexts/AccountDataContext';

import PoolItemInfo, { PoolItemInfoProps } from 'components/asset/PoolItemInfo';

import { LangKeys } from 'types/Lang';

import keys from './translations.json';

import formatNumber from 'utils/formatNumber';
import parseTimestamp from 'utils/parseTimestamp';
import PoolHeaderInfo from 'components/asset/PoolHeaderInfo';

type MaturityPoolInfoProps = {
  symbol: string;
  eMarketAddress?: string;
  networkName: string;
};

const MaturityPoolInfo: FC<MaturityPoolInfoProps> = ({ symbol, eMarketAddress, networkName }) => {
  const { accountData } = useContext(AccountDataContext);
  const lang: string = useContext(LangContext);
  const translations: { [key: string]: LangKeys } = keys;

  const [supply, setSupply] = useState<number | undefined>(undefined);
  const [demand, setDemand] = useState<number | undefined>(undefined);
  const [depositAPR, setDepositAPR] = useState<string | undefined>(undefined);
  const [borrowAPR, setBorrowAPR] = useState<string | undefined>(undefined);
  const [bestDepositAPRDate, setBestDepositAPRDate] = useState<string | undefined>(undefined);
  const [bestBorrowAPRDate, setBestBorrowAPRDate] = useState<string | undefined>(undefined);

  const fetchPoolData = useCallback(async () => {
    if (!accountData || !symbol) return;

    // FIXME: put real data
    setSupply(1);
    setDemand(1);
  }, [accountData, symbol]);

  useEffect(() => {
    fetchPoolData();
  }, [fetchPoolData]);

  const fetchAPRs = useCallback(async () => {
    if (!accountData || !eMarketAddress) return;

    // FIXME: put real data
    const depositAPRRate = 0.01;
    const borrowAPRRate = 0.01;
    const mockDate = parseTimestamp(Date.now() / 1000);

    setDepositAPR(`${(depositAPRRate * 100).toFixed(2)}%`);
    setBorrowAPR(`${(borrowAPRRate * 100).toFixed(2)}%`);

    setBestDepositAPRDate(mockDate);
    setBestBorrowAPRDate(mockDate);
  }, [accountData, eMarketAddress]);

  useEffect(() => {
    fetchAPRs();
  }, [fetchAPRs]);

  const itemsInfo: PoolItemInfoProps[] = [
    {
      label: translations[lang].totalDeposited,
      value: supply ? formatNumber(supply, symbol) : undefined
    },
    {
      label: translations[lang].totalBorrowed,
      value: demand ? formatNumber(demand, symbol) : undefined
    },
    {
      label: translations[lang].TVL,
      value: supply && demand ? formatNumber(supply - demand, symbol) : undefined
    },
    {
      label: translations[lang].bestDepositAPR,
      value: depositAPR,
      underLabel: bestDepositAPRDate
    },
    {
      label: translations[lang].bestBorrowAPR,
      value: borrowAPR,
      underLabel: bestBorrowAPRDate
    },
    {
      label: translations[lang].utilizationRate,
      value: supply && demand ? `${((demand / supply) * 100).toFixed(2)}%` : undefined
    }
  ];

  return (
    <Grid container>
      <PoolHeaderInfo title={translations[lang].maturityPools} itemsInfo={itemsInfo} />
    </Grid>
  );
};

export default MaturityPoolInfo;
