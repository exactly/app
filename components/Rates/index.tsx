import { Skeleton, Typography } from '@mui/material';
import APRWithBreakdown from 'components/APRWithBreakdown';
import React, { FC, useMemo } from 'react';
import { toPercentage } from 'utils/utils';
import numbers from 'config/numbers.json';
import useRewards from 'hooks/useRewards';

type Props = {
  symbol: string;
  type: 'deposit' | 'borrow';
  apr?: number;
};

const { minAPRValue } = numbers;

const Rates: FC<Props> = ({ symbol, type, apr }) => {
  const { rates } = useRewards();

  const totalAPR = useMemo(() => {
    if (apr === undefined) return undefined;
    return (
      apr +
      (type === 'deposit' ? 1 : -1) *
        (rates && rates[symbol]
          ? rates[symbol]?.reduce(
              (acc, curr) => acc + Number(type === 'deposit' ? curr.floatingDeposit : curr.borrow) / 1e18,
              0,
            )
          : 0)
    );
  }, [apr, rates, symbol, type]);

  return (
    <APRWithBreakdown
      markets={[{ apr, symbol }]}
      rewards={
        rates &&
        rates[symbol] &&
        rates[symbol]?.map((r) => ({
          symbol: r.assetSymbol,
          apr: Number(type === 'deposit' ? r.floatingDeposit : r.borrow) / 1e18,
        }))
      }
    >
      <Typography fontSize={16} fontWeight={700}>
        {(totalAPR !== undefined && toPercentage(totalAPR < minAPRValue ? undefined : totalAPR)) || (
          <Skeleton width={70} />
        )}
      </Typography>
    </APRWithBreakdown>
  );
};

export default Rates;
