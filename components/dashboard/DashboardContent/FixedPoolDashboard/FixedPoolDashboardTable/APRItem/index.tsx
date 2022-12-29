import { formatFixed } from '@ethersproject/bignumber';
import { Skeleton } from '@mui/material';
import useFixedOperation from 'hooks/useFixedPoolTransactions';
import React, { FC, useMemo } from 'react';
import calculateAPR from 'utils/calculateAPR';

const APRItem: FC<{ type: 'deposit' | 'borrow'; maturityDate: number; market: string; decimals: number }> = ({
  type,
  maturityDate,
  market,
  decimals,
}) => {
  const { depositTxs, borrowTxs } = useFixedOperation(type, maturityDate, market);

  const APR: number | undefined = useMemo(() => {
    const allTransactions = [...depositTxs, ...borrowTxs];
    if (!allTransactions) return undefined;

    let allAPRbyAmount = 0;
    let allAmounts = 0;

    allTransactions.forEach(({ fee, assets, timestamp, maturity }) => {
      const { transactionAPR } = calculateAPR(fee, decimals, assets, timestamp, maturity);
      allAPRbyAmount += transactionAPR * parseFloat(formatFixed(assets, decimals));
      allAmounts += parseFloat(formatFixed(assets, decimals));
    });

    return allAPRbyAmount / allAmounts;
  }, [depositTxs, borrowTxs, decimals]);

  return <>{APR !== undefined ? `${(APR || 0).toFixed(2)} %` : <Skeleton width={50} />}</>;
};

export default APRItem;
