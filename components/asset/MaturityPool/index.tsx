import { FC, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { formatEther, formatUnits } from '@ethersproject/units';
import { formatFixed, parseFixed } from '@ethersproject/bignumber';

import LangContext from 'contexts/LangContext';
import AccountDataContext from 'contexts/AccountDataContext';

import { LangKeys } from 'types/Lang';

import keys from './translations.json';

import numbers from 'config/numbers.json';

import parseSymbol from 'utils/parseSymbol';
import formatNumber from 'utils/formatNumber';
import { Grid } from '@mui/material';
import MaturityPoolInfo from './MaturityPoolInfo';
import PreviewerContext from 'contexts/PreviewerContext';
import ContractsContext from 'contexts/ContractsContext';
import { FixedMarketData } from 'types/FixedMarketData';
import parseTimestamp from 'utils/parseTimestamp';

type AssetMaturityPoolsProps = {
  symbol: string;
};

type BestAPR = {
  timestamp?: string;
  apr: string;
};

const { usdAmount: usdAmountPreviewer } = numbers;
const MIN_VALID_APR = 0.01;

const AssetMaturityPools: FC<AssetMaturityPoolsProps> = ({ symbol: rawSymbol }) => {
  const symbol = rawSymbol.toUpperCase();
  const { accountData } = useContext(AccountDataContext);
  const previewerData = useContext(PreviewerContext);
  const { getInstance } = useContext(ContractsContext);

  const lang: string = useContext(LangContext);
  const translations: { [key: string]: LangKeys } = keys;

  const [totalDeposited, setTotalDeposited] = useState<number | undefined>(undefined);
  const [totalBorrowed, setTotalBorrowed] = useState<number | undefined>(undefined);
  const [bestDepositAPR, setBestDepositAPR] = useState<BestAPR | undefined>(undefined);
  const [bestBorrowAPR, setBestBorrowAPR] = useState<BestAPR | undefined>(undefined);

  const getMaturitiesData = useCallback(async () => {
    if (!accountData) return;

    const previewerContract = getInstance(previewerData.address!, previewerData.abi!, 'previewer');

    const previewFixedData: FixedMarketData[] = await previewerContract?.previewFixed(
      parseFixed(usdAmountPreviewer.toString(), 18)
    );

    const { market: marketAddress } = accountData[symbol];
    const marketMaturities = previewFixedData.find(
      ({ market }) => market === marketAddress
    ) as FixedMarketData;
    console.log('***********************************');
    console.log({ marketMaturities });
    console.log('***********************************');

    const timestampNow = Date.now() / 1000;

    const { deposits, borrows, decimals, assets: initialAssets } = marketMaturities;

    const APRsPerMaturity: Record<string, { borrow: number | string; deposit: number | string }> =
      {};

    let maturityMaxAPRDeposit = 0;
    deposits.forEach(({ maturity: maturityBN, assets: finalDepositAssets }) => {
      const maturity = maturityBN.toNumber();
      const timePerYear = 31_536_000 / (maturity - timestampNow);
      const rate = finalDepositAssets.mul(parseFixed('1', 18)).div(initialAssets);
      const depositAPR = (Number(formatFixed(rate, 18)) - 1) * timePerYear * 100;

      debugger;

      const actualMax = APRsPerMaturity[maturityMaxAPRDeposit]?.deposit;
      if (
        depositAPR > MIN_VALID_APR &&
        (!actualMax || depositAPR > APRsPerMaturity[maturityMaxAPRDeposit]?.deposit)
      ) {
        maturityMaxAPRDeposit = maturity;
      }

      APRsPerMaturity[maturity] = {
        ...APRsPerMaturity[maturity],
        deposit: depositAPR < MIN_VALID_APR ? 'N/A' : depositAPR.toFixed(2)
      };
    });

    let maturityMinAPRBorrow = 0;
    borrows.forEach(({ maturity: maturityBN, assets: finalBorrowAssets }) => {
      const maturity = maturityBN.toNumber();
      const timePerYear = 31_536_000 / (maturity - timestampNow);
      const rate = finalBorrowAssets.mul(parseFixed('1', 18)).div(initialAssets);
      const borrowAPR = (Number(formatFixed(rate, 18)) - 1) * timePerYear * 100;

      const actualMin = APRsPerMaturity[maturityMinAPRBorrow]?.borrow;

      if (borrowAPR > MIN_VALID_APR && (!actualMin || borrowAPR < actualMin)) {
        maturityMinAPRBorrow = maturity;
      }

      APRsPerMaturity[maturity] = {
        ...APRsPerMaturity[maturity],
        borrow: borrowAPR < MIN_VALID_APR ? 'N/A' : borrowAPR.toFixed(2)
      };
    });

    console.log('***********************************');
    console.log({ APRsPerMaturity });
    console.log('***********************************');

    const { fixedPools } = accountData[symbol];
    let tempTotalSupplied = 0;
    let tempTotalBorrowed = 0;
    fixedPools.map(({ borrowed, supplied }) => {
      tempTotalSupplied += parseFloat(formatUnits(supplied, decimals));
      tempTotalBorrowed += parseFloat(formatUnits(borrowed, decimals));
    });

    const exchangeRate = parseFloat(formatEther(accountData[symbol].oraclePrice));

    setTotalDeposited(tempTotalSupplied * exchangeRate);
    setTotalBorrowed(tempTotalBorrowed * exchangeRate);

    setBestDepositAPR({
      timestamp: Boolean(maturityMaxAPRDeposit) ? parseTimestamp(maturityMaxAPRDeposit) : undefined,
      apr: APRsPerMaturity[maturityMaxAPRDeposit]?.deposit
        ? `${Number(APRsPerMaturity[maturityMaxAPRDeposit].deposit).toFixed(2)}%`
        : 'N/A'
    });
    setBestBorrowAPR({
      timestamp: Boolean(maturityMinAPRBorrow) ? parseTimestamp(maturityMinAPRBorrow) : undefined,
      apr: APRsPerMaturity[maturityMinAPRBorrow]?.borrow
        ? `${Number(APRsPerMaturity[maturityMinAPRBorrow].borrow).toFixed(2)}%`
        : 'N/A'
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
      {/* TODO: here goes the table - should pass APRsPerMaturity, where all the data is */}
    </Grid>
  );
};

export default AssetMaturityPools;
