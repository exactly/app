import React, { FC, useMemo } from 'react';
import Grid from '@mui/material/Grid';

import formatNumber from 'utils/formatNumber';
import HeaderInfo from 'components/common/HeaderInfo';
import { ItemInfoProps } from 'components/common/ItemInfo';
import { toPercentage } from 'utils/utils';

import numbers from 'config/numbers.json';
import parseTimestamp from 'utils/parseTimestamp';
import useRewards from 'hooks/useRewards';
import ItemCell from 'components/common/ItemCell';
import { useTranslation } from 'react-i18next';
import { formatUnits } from 'viem';
import { useCustomTheme } from 'contexts/ThemeContext';

type MaturityPoolInfoProps = {
  symbol: string;
  totalDeposited?: number;
  totalBorrowed?: number;
  bestDepositRate?: number;
  bestDepositMaturity?: number;
  bestBorrowRate?: number;
  bestBorrowMaturity?: number;
  adjustFactor?: bigint;
};

const MaturityPoolInfo: FC<MaturityPoolInfoProps> = ({
  symbol,
  totalDeposited,
  totalBorrowed,
  bestDepositRate,
  bestDepositMaturity,
  bestBorrowRate,
  bestBorrowMaturity,
  adjustFactor,
}) => {
  const { t } = useTranslation();
  const { minAPRValue } = numbers;
  const { showAPR, aprToAPY } = useCustomTheme();
  const { rates } = useRewards();

  const itemsInfo: ItemInfoProps[] = useMemo(
    () => [
      {
        label: t('Total Deposits'),
        value: totalDeposited !== undefined ? `$${formatNumber(totalDeposited)}` : undefined,
      },
      {
        label: t('Total Borrows'),
        value: totalBorrowed !== undefined ? `$${formatNumber(totalBorrowed)}` : undefined,
      },
      {
        label: t('Risk-Adjust Factor'),
        value: adjustFactor ? formatUnits(adjustFactor, 18) : undefined,
        tooltipTitle: t(
          'The Borrow risk-adjust factor is a measure that helps evaluate how risky an asset is compared to others. The higher the number, the safer the asset is considered to be, making it more valuable as collateral when requesting a loan.',
        ),
      },
      {
        label: t('Best Deposit APR'),
        value:
          (bestDepositRate && bestDepositRate > minAPRValue) || bestDepositRate === 0 ? (
            <ItemCell
              key={symbol}
              value={toPercentage(bestDepositRate !== 0 ? bestDepositRate : undefined)}
              symbol={bestDepositRate && bestDepositRate > minAPRValue ? symbol : undefined}
            />
          ) : undefined,
        underLabel: bestDepositMaturity ? parseTimestamp(bestDepositMaturity) : undefined,
        tooltipTitle: t('The highest fixed interest APR for a deposit up to the optimal deposit size.'),
      },
      {
        label: t('Best Borrow APR'),
        value:
          bestBorrowRate && bestBorrowRate > minAPRValue ? (
            <ItemCell key={symbol} value={toPercentage(bestBorrowRate)} symbol={symbol} />
          ) : undefined,
        underLabel: bestBorrowMaturity ? parseTimestamp(bestBorrowMaturity) : undefined,
        tooltipTitle: t(
          'The lowest fixed borrowing interest APR at current utilization levels for all the Fixed Rate Pools.',
        ),
      },
      ...(rates[symbol] && rates[symbol].some((r) => r.borrow > 0n)
        ? [
            {
              label: showAPR ? t('Borrow Rewards APR') : t('Borrow Rewards APY'),
              value: (
                <>
                  {rates[symbol].map((r) => (
                    <ItemCell
                      key={r.asset}
                      value={toPercentage(Number(aprToAPY(r.borrow)) / 1e18)}
                      symbol={r.assetSymbol}
                    />
                  ))}
                </>
              ),
              tooltipTitle: showAPR
                ? t('This APR assumes a constant price for the OP token and distribution rate.')
                : t('This APY assumes a constant price for the OP token and distribution rate.'),
            },
          ]
        : []),
    ],
    [
      t,
      totalDeposited,
      totalBorrowed,
      adjustFactor,
      bestDepositRate,
      minAPRValue,
      symbol,
      bestDepositMaturity,
      bestBorrowRate,
      bestBorrowMaturity,
      rates,
      showAPR,
      aprToAPY,
    ],
  );

  return (
    <Grid container>
      <HeaderInfo
        title={t('Fixed Interest Rate')}
        itemsInfo={itemsInfo}
        shadow={false}
        xs={itemsInfo.length > 4 ? 4 : 6}
      />
    </Grid>
  );
};

export default MaturityPoolInfo;
