import React, { FC, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { formatUnits } from 'viem';

import formatNumber from 'utils/formatNumber';
import { toPercentage } from 'utils/utils';

import { ItemInfoProps } from 'components/common/ItemInfo';
import HeaderInfo from 'components/common/HeaderInfo';
import OrderAction from 'components/OrderAction';
import { Box } from '@mui/material';
import useAccountData from 'hooks/useAccountData';
import useFloatingPoolAPR from 'hooks/useFloatingPoolAPR';
import useRewards from 'hooks/useRewards';
import ItemCell from 'components/common/ItemCell';
import { WEI_PER_ETHER } from 'utils/const';
import numbers from 'config/numbers.json';

type FloatingPoolInfoProps = {
  symbol: string;
};

const FloatingPoolInfo: FC<FloatingPoolInfoProps> = ({ symbol }) => {
  const { t } = useTranslation();
  const { depositAPR, borrowAPR } = useFloatingPoolAPR(symbol);
  const { marketAccount } = useAccountData(symbol);

  const { rates } = useRewards();
  const { minRewardsRate } = numbers;
  const { deposited, borrowed } = useMemo(() => {
    if (!marketAccount) return {};
    const {
      totalFloatingDepositAssets: totalDeposited,
      totalFloatingBorrowAssets: totalBorrowed,
      decimals,
      usdPrice,
    } = marketAccount;

    return {
      deposited: Number((totalDeposited * usdPrice) / WEI_PER_ETHER) / 10 ** decimals,
      borrowed: Number((totalBorrowed * usdPrice) / WEI_PER_ETHER) / 10 ** decimals,
    };
  }, [marketAccount]);

  const itemsInfo: ItemInfoProps[] = useMemo(
    () => [
      {
        label: t('Total Deposits'),
        value: deposited !== undefined ? `$${formatNumber(deposited)}` : undefined,
      },
      {
        label: t('Total Borrows'),
        value: borrowed !== undefined ? `$${formatNumber(borrowed)}` : undefined,
      },
      {
        label: t('Total Available'),
        value: deposited !== undefined && borrowed !== undefined ? `$${formatNumber(deposited - borrowed)}` : undefined,
      },
      {
        label: t('Deposit APR'),
        value:
          depositAPR !== undefined && marketAccount?.assetSymbol ? (
            <ItemCell key={symbol} value={toPercentage(depositAPR)} symbol={marketAccount.assetSymbol} />
          ) : undefined,
        tooltipTitle: t(
          'Change in the underlying Variable Rate Pool shares value over the last 15 minutes, annualized.',
        ),
      },
      {
        label: t('Borrow APR'),
        value:
          borrowAPR !== undefined && marketAccount?.assetSymbol ? (
            <ItemCell key={symbol} value={toPercentage(borrowAPR)} symbol={marketAccount.assetSymbol} />
          ) : undefined,
        tooltipTitle: t(
          'The borrowing interest APR related to the current utilization rate in the Variable Rate Pool.',
        ),
      },
      {
        label: t('Utilization Rate'),
        value:
          deposited !== undefined && borrowed !== undefined
            ? toPercentage(deposited > 0 ? borrowed / deposited : undefined)
            : undefined,
      },
      ...(rates[symbol] && rates[symbol].some((r) => r.floatingDeposit > 0n)
        ? [
            {
              label: t('Deposit Rewards APR'),
              value: (
                <>
                  {rates[symbol].map(
                    (r) =>
                      Number(r.floatingDeposit) / 1e18 > minRewardsRate && (
                        <ItemCell
                          key={r.asset}
                          value={toPercentage(Number(r.floatingDeposit) / 1e18)}
                          symbol={r.assetSymbol}
                        />
                      ),
                  )}
                </>
              ),
              tooltipTitle: t('This APR assumes a constant price for the OP token and distribution rate.'),
            },
          ]
        : []),
      ...(rates[symbol] && rates[symbol].some((r) => r.borrow > 0n)
        ? [
            {
              label: t('Borrow Rewards APR'),
              value: (
                <>
                  {rates[symbol].map(
                    (r) =>
                      Number(r.borrow) / 1e18 > minRewardsRate && (
                        <ItemCell key={r.asset} value={toPercentage(Number(r.borrow) / 1e18)} symbol={r.assetSymbol} />
                      ),
                  )}
                </>
              ),
              tooltipTitle: t('This APR assumes a constant price for the OP token and distribution rate.'),
            },
          ]
        : []),
      {
        label: t('Risk-Adjust Factor'),
        value: marketAccount?.adjustFactor ? formatUnits(marketAccount.adjustFactor, 18) : undefined,
        tooltipTitle: t(
          'The Deposit and Borrow risk-adjust factor is a measure that helps evaluate how risky an asset is compared to others. The higher the number, the safer the asset is considered to be, making it more valuable as collateral when requesting a loan.',
        ),
      },
    ],
    [deposited, borrowed, depositAPR, marketAccount, symbol, borrowAPR, rates, t],
  );

  return (
    <Box display="flex" justifyContent="space-between" flexDirection="column" gap={2}>
      <HeaderInfo title={t('Variable Interest Rate')} itemsInfo={itemsInfo} shadow={false} xs={4} />
      <Box pb={3} px={3} mt={{ xs: -1, sm: 0 }}>
        <OrderAction symbol={symbol} />
      </Box>
    </Box>
  );
};

export default FloatingPoolInfo;
