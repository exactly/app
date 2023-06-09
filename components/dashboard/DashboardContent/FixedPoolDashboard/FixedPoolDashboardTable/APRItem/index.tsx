import React, { FC, useMemo } from 'react';
import { Address, formatUnits } from 'viem';
import { Skeleton } from '@mui/material';
import useFixedPoolTransactions from 'hooks/useFixedPoolTransactions';
import { calculateAPR } from 'utils/calculateAPR';

const APRItem: FC<{ type: 'deposit' | 'borrow'; maturityDate: number; market: Address; decimals: number }> = ({
  type,
  maturityDate,
  market,
  decimals,
}) => {
  const { depositTxs, borrowTxs } = useFixedPoolTransactions(type, maturityDate, market);

  const APR: bigint | undefined = useMemo(() => {
    const allTransactions = [...depositTxs, ...borrowTxs];
    if (!allTransactions) return undefined;

    const wad = 10n ** BigInt(decimals);
    let allAPRbyAmount = 0n;
    let allAmounts = 0n;

    allTransactions.forEach(({ fee, assets, timestamp, maturity }) => {
      const transactionAPR = calculateAPR(fee, assets, BigInt(timestamp), BigInt(maturity));
      allAPRbyAmount += (transactionAPR * assets) / wad;
      allAmounts += assets;
    });

    if (allAmounts === 0n) return 0n;

    return (allAPRbyAmount * wad) / allAmounts;
  }, [depositTxs, borrowTxs, decimals]);

  return <>{APR !== undefined ? `${(Number(formatUnits(APR, 18)) || 0).toFixed(2)} %` : <Skeleton width={50} />}</>;
};

export default APRItem;
