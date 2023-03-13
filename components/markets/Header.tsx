import React, { type FC, useMemo } from 'react';
import { BigNumber, formatFixed, parseFixed } from '@ethersproject/bignumber/lib';
import { Zero } from '@ethersproject/constants/lib';

import HeaderInfo from 'components/common/HeaderInfo';
import { ItemInfoProps } from 'components/common/ItemInfo';

import formatNumber from 'utils/formatNumber';
import { Box } from '@mui/material';
import { useWeb3 } from 'hooks/useWeb3';
import Image from 'next/image';
import useAccountData from 'hooks/useAccountData';

const MarketsHeader: FC = () => {
  const { accountData } = useAccountData();
  const { chain } = useWeb3();

  const { totalDeposited, totalBorrowed, totalAvailable } = useMemo<{
    totalDeposited?: BigNumber;
    totalBorrowed?: BigNumber;
    totalAvailable?: BigNumber;
  }>(() => {
    if (!accountData) return {};
    const { totalDepositedUSD, totalBorrowedUSD } = accountData.reduce(
      (acc, { totalFloatingDepositAssets, totalFloatingBorrowAssets, usdPrice, fixedPools, decimals }) => {
        // iterate through fixed pools to get totals
        const { fixedTotalDeposited, fixedTotalBorrowed } = fixedPools.reduce(
          (fixedPoolStats, pool) => {
            const { supplied, borrowed, available } = pool;

            fixedPoolStats.fixedTotalDeposited = fixedPoolStats.fixedTotalDeposited.add(supplied);
            fixedPoolStats.fixedTotalBorrowed = fixedPoolStats.fixedTotalBorrowed.add(borrowed);
            fixedPoolStats.fixedTotalAvailable = fixedPoolStats.fixedTotalAvailable.add(available);
            return fixedPoolStats;
          },
          { fixedTotalDeposited: Zero, fixedTotalBorrowed: Zero, fixedTotalAvailable: Zero },
        );

        const WADDecimals = parseFixed('1', decimals);
        acc.totalDepositedUSD = acc.totalDepositedUSD.add(
          totalFloatingDepositAssets.add(fixedTotalDeposited).mul(usdPrice).div(WADDecimals),
        );
        acc.totalBorrowedUSD = acc.totalBorrowedUSD.add(
          totalFloatingBorrowAssets.add(fixedTotalBorrowed).mul(usdPrice).div(WADDecimals),
        );
        return acc;
      },
      { totalDepositedUSD: Zero, totalBorrowedUSD: Zero },
    );

    return {
      totalDeposited: totalDepositedUSD,
      totalBorrowed: totalBorrowedUSD,
      totalAvailable: totalDepositedUSD.sub(totalBorrowedUSD),
    };
  }, [accountData]);

  const itemsInfo: ItemInfoProps[] = [
    {
      label: 'Total Deposits',
      value: totalDeposited ? `$${formatNumber(formatFixed(totalDeposited, 18))}` : undefined,
    },
    {
      label: 'Total Borrows',
      value: totalBorrowed ? `$${formatNumber(formatFixed(totalBorrowed, 18))}` : undefined,
    },
    {
      label: 'Total Available',
      value: totalAvailable ? `$${formatNumber(formatFixed(totalAvailable, 18))}` : undefined,
    },
  ];

  return (
    <HeaderInfo
      itemsInfo={itemsInfo}
      title={
        <Box display="flex" gap={0.5}>
          <Image
            src={`/img/networks/${chain?.id}.svg`}
            alt={`chain id ${chain?.id}`}
            width={24}
            height={24}
            style={{
              maxWidth: '100%',
              height: 'auto',
            }}
          />
          <Box>{`${chain?.name} Network`}</Box>
        </Box>
      }
    />
  );
};

export default MarketsHeader;
