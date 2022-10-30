import React, { FC, useCallback, useContext, useEffect, useState } from 'react';
import { formatFixed, parseFixed } from '@ethersproject/bignumber';
import { Zero, WeiPerEther } from '@ethersproject/constants';
import Grid from '@mui/material/Grid';

import AccountDataContext from 'contexts/AccountDataContext';

import numbers from 'config/numbers.json';

import MaturityPoolInfo from './MaturityPoolInfo';
import PreviewerContext from 'contexts/PreviewerContext';
import ContractsContext from 'contexts/ContractsContext';
import { FixedMarketData } from 'types/FixedMarketData';
import parseTimestamp from 'utils/parseTimestamp';
import MaturityPoolsTable from './MaturityPoolsTable';
import getAPRsPerMaturity, { APRsPerMaturityType } from 'utils/getAPRsPerMaturity';

type AssetMaturityPoolsProps = {
  symbol: string;
};

type BestAPR = {
  timestamp?: string;
  apr: number;
};

const { usdAmount: usdAmountPreviewer } = numbers;

const AssetMaturityPools: FC<AssetMaturityPoolsProps> = ({ symbol }) => {
  const { accountData } = useContext(AccountDataContext);
  const previewerData = useContext(PreviewerContext);
  const { getInstance } = useContext(ContractsContext);

  const [totalDeposited, setTotalDeposited] = useState<number | undefined>(undefined);
  const [totalBorrowed, setTotalBorrowed] = useState<number | undefined>(undefined);
  const [bestDepositAPR, setBestDepositAPR] = useState<BestAPR | undefined>(undefined);
  const [bestBorrowAPR, setBestBorrowAPR] = useState<BestAPR | undefined>(undefined);
  const [APRsPerMaturity, setAPRsPerMaturity] = useState<APRsPerMaturityType>({});

  const getMaturitiesData = useCallback(async () => {
    if (!accountData) return;

    const previewerContract = getInstance(previewerData.address!, previewerData.abi!, 'previewer');

    const previewFixedData: FixedMarketData[] = await previewerContract?.previewFixed(
      parseFixed(usdAmountPreviewer.toString(), 18),
    );

    const { market: marketAddress } = accountData[symbol];
    const marketMaturities = previewFixedData.find(({ market }) => market === marketAddress) as FixedMarketData;

    const { deposits, borrows, decimals, assets: initialAssets } = marketMaturities;

    const { APRsPerMaturity, maturityMaxAPRDeposit, maturityMinAPRBorrow } = getAPRsPerMaturity(
      deposits,
      borrows,
      decimals,
      initialAssets,
    );

    setAPRsPerMaturity(APRsPerMaturity);

    const { fixedPools, usdPrice: exchangeRate } = accountData[symbol];
    let tempTotalDeposited = Zero;
    let tempTotalBorrowed = Zero;
    fixedPools.map(({ borrowed, supplied: deposited }) => {
      tempTotalDeposited = tempTotalDeposited.add(deposited);
      tempTotalBorrowed = tempTotalBorrowed.add(borrowed);
    });

    const totalDepositedUSD = formatFixed(tempTotalDeposited.mul(exchangeRate).div(WeiPerEther), decimals);
    const totalBorrowedUSD = formatFixed(tempTotalBorrowed.mul(exchangeRate).div(WeiPerEther), decimals);

    setTotalDeposited(Number(totalDepositedUSD));
    setTotalBorrowed(Number(totalBorrowedUSD));

    setBestDepositAPR({
      timestamp: maturityMaxAPRDeposit ? parseTimestamp(maturityMaxAPRDeposit) : undefined,
      apr: APRsPerMaturity[maturityMaxAPRDeposit]?.deposit,
    });
    setBestBorrowAPR({
      timestamp: maturityMinAPRBorrow ? parseTimestamp(maturityMinAPRBorrow) : undefined,
      apr: APRsPerMaturity[maturityMinAPRBorrow]?.borrow,
    });
  }, [accountData, symbol, previewerData]);

  useEffect(() => {
    getMaturitiesData();
  }, [getMaturitiesData]);

  return (
    <Grid container spacing={2}>
      <Grid item xs={12}>
        <MaturityPoolInfo
          totalDeposited={totalDeposited}
          totalBorrowed={totalBorrowed}
          bestDepositAPR={bestDepositAPR?.apr}
          bestDepositAPRDate={bestDepositAPR?.timestamp}
          bestBorrowAPR={bestBorrowAPR?.apr}
          bestBorrowAPRDate={bestBorrowAPR?.timestamp}
        />
      </Grid>
      <Grid item xs={12}>
        <MaturityPoolsTable APRsPerMaturity={APRsPerMaturity} symbol={symbol} />
      </Grid>
    </Grid>
  );
};

export default AssetMaturityPools;
