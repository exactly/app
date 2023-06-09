import React, { type FC, useMemo } from 'react';
import { formatUnits, parseUnits } from 'viem';
import { useTranslation } from 'react-i18next';
import Image from 'next/image';
import { Box } from '@mui/material';

import HeaderInfo from 'components/common/HeaderInfo';
import { ItemInfoProps } from 'components/common/ItemInfo';

import formatNumber from 'utils/formatNumber';
import { useWeb3 } from 'hooks/useWeb3';
import useAccountData from 'hooks/useAccountData';

const MarketsHeader: FC = () => {
  const { t } = useTranslation();
  const { accountData } = useAccountData();
  const { chain } = useWeb3();

  const { totalDeposited, totalBorrowed, totalAvailable } = useMemo<{
    totalDeposited?: bigint;
    totalBorrowed?: bigint;
    totalAvailable?: bigint;
  }>(() => {
    if (!accountData) return {};
    const { totalDepositedUSD, totalBorrowedUSD } = accountData.reduce(
      (acc, { totalFloatingDepositAssets, totalFloatingBorrowAssets, usdPrice, fixedPools, decimals }) => {
        // iterate through fixed pools to get totals
        const { fixedTotalDeposited, fixedTotalBorrowed } = fixedPools.reduce(
          (fixedPoolStats, pool) => {
            const { supplied, borrowed, available } = pool;

            fixedPoolStats.fixedTotalDeposited += supplied;
            fixedPoolStats.fixedTotalBorrowed += borrowed;
            fixedPoolStats.fixedTotalAvailable += available;
            return fixedPoolStats;
          },
          { fixedTotalDeposited: 0n, fixedTotalBorrowed: 0n, fixedTotalAvailable: 0n },
        );

        const WADDecimals = parseUnits('1', decimals);
        acc.totalDepositedUSD += ((totalFloatingDepositAssets + fixedTotalDeposited) * usdPrice) / WADDecimals;
        acc.totalBorrowedUSD += ((totalFloatingBorrowAssets + fixedTotalBorrowed) * usdPrice) / WADDecimals;
        return acc;
      },
      { totalDepositedUSD: 0n, totalBorrowedUSD: 0n },
    );

    return {
      totalDeposited: totalDepositedUSD,
      totalBorrowed: totalBorrowedUSD,
      totalAvailable: totalDepositedUSD - totalBorrowedUSD,
    };
  }, [accountData]);

  const itemsInfo: ItemInfoProps[] = [
    {
      label: t('Total Deposits'),
      value: totalDeposited ? `$${formatNumber(formatUnits(totalDeposited, 18))}` : undefined,
    },
    {
      label: t('Total Borrows'),
      value: totalBorrowed ? `$${formatNumber(formatUnits(totalBorrowed, 18))}` : undefined,
    },
    {
      label: t('Total Available'),
      value: totalAvailable ? `$${formatNumber(formatUnits(totalAvailable, 18))}` : undefined,
    },
  ];

  const network = t('{{network}} Network', { network: chain?.name });

  return (
    <HeaderInfo
      itemsInfo={itemsInfo}
      title={
        <Box display="flex" gap={0.5}>
          <Image
            src={`/img/networks/${chain?.id}.svg`}
            alt=""
            width={24}
            height={24}
            style={{
              maxWidth: '100%',
              height: 'auto',
            }}
          />
          <Box>{network}</Box>
        </Box>
      }
    />
  );
};

export default MarketsHeader;
