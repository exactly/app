import React, { type FC, useContext, useMemo } from 'react';
import { BigNumber, formatFixed, parseFixed } from '@ethersproject/bignumber/lib';
import { Zero } from '@ethersproject/constants/lib';
import { useNetwork } from 'wagmi';

import HeaderInfo from 'components/common/HeaderInfo';
import { ItemInfoProps } from 'components/common/ItemInfo';

import AccountDataContext from 'contexts/AccountDataContext';

import formatNumber from 'utils/formatNumber';
import { Box } from '@mui/material';
import { useWeb3 } from 'hooks/useWeb3';
import Image from 'next/image';

const MarketsHeader: FC = () => {
  const { accountData } = useContext(AccountDataContext);
  const { chain } = useWeb3();
  const { chains } = useNetwork();
  const isSupportedChain = useMemo(() => chain?.id && chains.map((c) => c.id).includes(chain.id), [chain?.id, chains]);

  const { totalDeposited, totalBorrowed, totalAvailable } = useMemo<{
    totalDeposited?: BigNumber;
    totalBorrowed?: BigNumber;
    totalAvailable?: BigNumber;
  }>(() => {
    if (!accountData) return {};
    const { totalDepositedUSD, totalBorrowedUSD } = Object.keys(accountData).reduce(
      (acc, symbol) => {
        const { totalFloatingDepositAssets, totalFloatingBorrowAssets, usdPrice, fixedPools, decimals } =
          accountData[symbol];

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
          {isSupportedChain && (
            <Image src={`/img/networks/${chain?.id}.svg`} alt={`chain id ${chain?.id}`} width={24} height={24} />
          )}
          <Box>{isSupportedChain ? `${chain?.name} Market` : 'Markets'}</Box>
        </Box>
      }
    />
  );
};

export default MarketsHeader;
