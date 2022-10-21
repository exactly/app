import { FC, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { formatUnits } from '@ethersproject/units';
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
import getAPRsPerMaturity, { APRsPerMaturityType } from './utils';

type AssetMaturityPoolsProps = {
  symbol: string;
};

type BestAPR = {
  timestamp?: string;
  apr: string;
};

const { usdAmount: usdAmountPreviewer, minAPRValue } = numbers;

const AssetMaturityPools: FC<AssetMaturityPoolsProps> = ({ symbol: rawSymbol }) => {
  const symbol = rawSymbol.toUpperCase();
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
    const marketMaturities = previewFixedData.find(
      ({ market }) => market === marketAddress,
    ) as FixedMarketData;

    const { deposits, borrows, decimals, assets: initialAssets } = marketMaturities;

    const { APRsPerMaturity, maturityMaxAPRDeposit, maturityMinAPRBorrow } = getAPRsPerMaturity(
      deposits,
      borrows,
      decimals,
      initialAssets
    );

    setAPRsPerMaturity(APRsPerMaturity);

    const { fixedPools, usdPrice: exchangeRate } = accountData[symbol];
    let tempTotalDeposited = Zero;
    let tempTotalBorrowed = Zero;
    fixedPools.map(({ borrowed, supplied: deposited }) => {
      tempTotalDeposited = tempTotalDeposited.add(deposited);
      tempTotalBorrowed = tempTotalBorrowed.add(borrowed);
    });

    const totalDepositedUSD = formatUnits(
      tempTotalDeposited.mul(exchangeRate).div(WeiPerEther),
      decimals,
    );
    const totalBorrowedUSD = formatUnits(
      tempTotalBorrowed.mul(exchangeRate).div(WeiPerEther),
      decimals,
    );

    setTotalDeposited(Number(totalDepositedUSD));
    setTotalBorrowed(Number(totalBorrowedUSD));

    setBestDepositAPR({
      timestamp: Boolean(maturityMaxAPRDeposit) ? parseTimestamp(maturityMaxAPRDeposit) : undefined,
      apr: APRsPerMaturity[maturityMaxAPRDeposit]?.deposit
        ? `${Number(APRsPerMaturity[maturityMaxAPRDeposit].deposit).toFixed(2)}%`
        : 'N/A',
    });
    setBestBorrowAPR({
      timestamp: Boolean(maturityMinAPRBorrow) ? parseTimestamp(maturityMinAPRBorrow) : undefined,
      apr: APRsPerMaturity[maturityMinAPRBorrow]?.borrow
        ? `${Number(APRsPerMaturity[maturityMinAPRBorrow].borrow).toFixed(2)}%`
        : 'N/A',
    });
  }, [accountData, symbol, getInstance, previewerData]);

  useEffect(() => {
    getMaturitiesData();
  }, [getMaturitiesData]);

  return (
    <Grid>
      <MaturityPoolInfo
        totalDeposited={totalDeposited}
        totalBorrowed={totalBorrowed}
        bestDepositAPR={bestDepositAPR?.apr}
        bestDepositAPRDate={bestDepositAPR?.timestamp}
        bestBorrowAPR={bestBorrowAPR?.apr}
        bestBorrowAPRDate={bestBorrowAPR?.timestamp}
      />
      <MaturityPoolsTable APRsPerMaturity={APRsPerMaturity} />
    </Grid>
  );
};

export default AssetMaturityPools;
