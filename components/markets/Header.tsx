import React, { FC, useContext, useEffect, useState } from 'react';
import HeaderInfo from 'components/common/HeaderInfo';
import { ItemInfoProps } from 'components/common/ItemInfo';
import OrderAction from 'components/OrderAction';
import AccountDataContext from 'contexts/AccountDataContext';
import { BigNumber, formatFixed, parseFixed } from '@ethersproject/bignumber/lib';
import { Zero } from '@ethersproject/constants/lib';
import { FixedPool } from 'types/FixedLenderAccountData';
import formatNumber from 'utils/formatNumber';

const MarketsHeader: FC = () => {
  const { accountData } = useContext(AccountDataContext);
  const [totalDeposited, setTotalDeposited] = useState<BigNumber | undefined>(undefined);
  const [totalBorrowed, setTotalBorrowed] = useState<BigNumber | undefined>(undefined);
  const [totalAvailable, setTotalAvailable] = useState<BigNumber | undefined>(undefined);

  useEffect(() => {
    if (!accountData) return;

    const { totalDepositedUSD, totalBorrowedUSD, totalAvailableUSD } = Object.keys(accountData).reduce(
      (acc: any, symbol) => {
        const {
          totalFloatingDepositAssets,
          totalFloatingBorrowAssets,
          usdPrice,
          fixedPools,
          floatingAvailableAssets,
          decimals,
        } = accountData[symbol];

        // iterate through fixed pools to get totals
        const { fixedTotalDeposited, fixedTotalBorrowed, fixedTotalAvailable } = fixedPools.reduce(
          (fixedPoolStats: any, pool: FixedPool) => {
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
        acc.totalAvailableUSD = acc.totalAvailableUSD.add(
          floatingAvailableAssets.add(fixedTotalAvailable).mul(usdPrice).div(WADDecimals),
        );
        return acc;
      },
      { totalDepositedUSD: Zero, totalBorrowedUSD: Zero, totalAvailableUSD: Zero },
    );

    setTotalDeposited(totalDepositedUSD);
    setTotalBorrowed(totalBorrowedUSD);
    setTotalAvailable(totalAvailableUSD);
  }, [accountData]);

  const itemsInfo: ItemInfoProps[] = [
    {
      label: 'Total Deposited',
      value: totalDeposited != null ? formatNumber(formatFixed(totalDeposited, 18)) : undefined,
    },
    {
      label: 'Total Borrowed',
      value: totalBorrowed != null ? formatNumber(formatFixed(totalBorrowed, 18)) : undefined,
    },
    {
      label: 'Total Available',
      value: totalAvailable != null ? formatNumber(formatFixed(totalAvailable, 18)) : undefined,
    },
  ];
  return <HeaderInfo itemsInfo={itemsInfo} title="Markets" rightAction={<OrderAction />} />;
};

export default MarketsHeader;
