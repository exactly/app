import React, { FC, useMemo } from 'react';
import { WeiPerEther, Zero } from '@ethersproject/constants';

import formatNumber from 'utils/formatNumber';
import { toPercentage } from 'utils/utils';

import { ItemInfoProps } from 'components/common/ItemInfo';
import HeaderInfo from 'components/common/HeaderInfo';
import OrderAction from 'components/OrderAction';
import { Box } from '@mui/material';
import useAccountData from 'hooks/useAccountData';
import useFloatingPoolAPR from 'hooks/useFloatingPoolAPR';
import useRewards from 'hooks/useRewards';
import RewardPill from 'components/markets/RewardPill';
import ItemCell from 'components/common/ItemCell';

type FloatingPoolInfoProps = {
  symbol: string;
};

const FloatingPoolInfo: FC<FloatingPoolInfoProps> = ({ symbol }) => {
  const { depositAPR, borrowAPR } = useFloatingPoolAPR(symbol);
  const { marketAccount } = useAccountData(symbol);

  const { rates } = useRewards();

  const { deposited, borrowed } = useMemo(() => {
    if (!marketAccount) return {};
    const {
      totalFloatingDepositAssets: totalDeposited,
      totalFloatingBorrowAssets: totalBorrowed,
      decimals,
      usdPrice,
    } = marketAccount;

    return {
      deposited: Number(totalDeposited.mul(usdPrice).div(WeiPerEther)) / 10 ** decimals,
      borrowed: Number(totalBorrowed.mul(usdPrice).div(WeiPerEther)) / 10 ** decimals,
    };
  }, [marketAccount]);

  const itemsInfo: ItemInfoProps[] = useMemo(
    () => [
      {
        label: 'Total Deposits',
        value: deposited !== undefined ? `$${formatNumber(deposited)}` : undefined,
      },
      {
        label: 'Total Borrows',
        value: borrowed !== undefined ? `$${formatNumber(borrowed)}` : undefined,
      },
      {
        label: 'Total Available',
        value: deposited !== undefined && borrowed !== undefined ? `$${formatNumber(deposited - borrowed)}` : undefined,
      },
      {
        label: 'Deposit APR',
        value: depositAPR !== undefined ? toPercentage(depositAPR) : undefined,
        tooltipTitle: 'Change in the underlying Variable Rate Pool shares value over the last 15 minutes, annualized.',
      },
      {
        label: 'Borrow APR',
        value: borrowAPR !== undefined ? toPercentage(borrowAPR) : undefined,
        tooltipTitle: 'Change in the underlying Variable Rate Pool shares value over the last hour, annualized.',
      },
      {
        label: 'Utilization Rate',
        value:
          deposited !== undefined && borrowed !== undefined
            ? toPercentage(deposited > 0 ? borrowed / deposited : undefined)
            : undefined,
      },
      ...(rates[symbol] && rates[symbol].some((r) => r.floatingDeposit.gt(Zero))
        ? [
            {
              label: 'Deposit Rewards',
              value: (
                <>
                  {rates[symbol].map((r) => (
                    <ItemCell
                      key={r.asset}
                      value={toPercentage(Number(r.floatingDeposit) / 1e18)}
                      symbol={r.assetSymbol}
                    />
                  ))}
                </>
              ),
            },
          ]
        : []),
      ...(rates[symbol] && rates[symbol].some((r) => r.borrow.gt(Zero))
        ? [
            {
              label: 'Borrow Rewards',
              value: (
                <>
                  {rates[symbol].map((r) => (
                    <ItemCell key={r.asset} value={toPercentage(Number(r.borrow) / 1e18)} symbol={r.assetSymbol} />
                  ))}
                </>
              ),
            },
          ]
        : []),
    ],
    [deposited, borrowed, depositAPR, borrowAPR, rates, symbol],
  );

  return (
    <Box display="flex" justifyContent="space-between" flexDirection="column" gap={2}>
      <HeaderInfo title="Variable Interest Rate" itemsInfo={itemsInfo} shadow={false} xs={4} />
      <Box pb={3} px={3} mt={{ xs: -1, sm: 0 }}>
        <OrderAction symbol={symbol} />
      </Box>
    </Box>
  );
};

export default FloatingPoolInfo;
