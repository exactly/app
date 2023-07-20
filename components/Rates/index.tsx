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
  label?: string;
  sx?: React.ComponentProps<typeof Typography>['sx'];
  directionMobile?: 'row' | 'row-reverse';
  iconsSize?: number;
  isLoading?: boolean;
};

const { minAPRValue } = numbers;

const Rates: FC<Props> = ({
  symbol,
  type,
  apr,
  label,
  sx = { fontSize: 16, fontWeight: 700 },
  directionMobile,
  iconsSize,
  isLoading = false,
}) => {
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
      directionMobile={directionMobile}
      iconsSize={iconsSize}
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
      <Typography sx={sx}>
        {!isLoading && totalAPR !== undefined ? (
          `${totalAPR > 999 ? '∞' : toPercentage(totalAPR < minAPRValue ? undefined : totalAPR)}${
            label ? ' ' + label : ''
          }`
        ) : (
          <Skeleton width={70} />
        )}
      </Typography>
    </APRWithBreakdown>
  );
};

export default Rates;
