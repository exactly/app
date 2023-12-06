import React, { type FC, useMemo } from 'react';
import { formatUnits, parseUnits } from 'viem';
import { useTranslation } from 'react-i18next';

import HeaderInfo from 'components/common/HeaderInfo';
import { ItemInfoProps } from 'components/common/ItemInfo';

import formatNumber from 'utils/formatNumber';
import useAccountData from 'hooks/useAccountData';

const MarketsHeader: FC = () => {
  const { t } = useTranslation();
  const { accountData } = useAccountData();

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

  return <HeaderInfo shadow={false} itemsInfo={itemsInfo} />;
};

export default MarketsHeader;
