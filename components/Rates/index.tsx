import { Skeleton, Typography } from '@mui/material';
import APRWithBreakdown from 'components/APRWithBreakdown';
import React, { FC, useEffect, useMemo, useState } from 'react';
import { toPercentage } from 'utils/utils';
import numbers from 'config/numbers.json';
import { LidoResponse } from 'hooks/useStETHNativeAPR';
import { useDebtManagerContext } from 'contexts/DebtManagerContext';

type Props = {
  symbol: string;
  type: 'deposit' | 'borrow';
  apr?: number;
  label?: string;
  sx?: React.ComponentProps<typeof Typography>['sx'];
  directionMobile?: 'row' | 'row-reverse';
  iconsSize?: number;
  isLoading?: boolean;
  hideMarket?: boolean;
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
  hideMarket = false,
}) => {
  const { rates } = useDebtManagerContext();

  const [native, setNative] = useState<number>(0);

  useEffect(() => {
    (async () => {
      if (symbol !== 'wstETH' || type === 'borrow') return;

      const response = (await fetch('https://eth-api.lido.fi/v1/protocol/steth/apr/last').then((res) =>
        res.json(),
      )) as LidoResponse;

      setNative(response.data.apr / 100);
    })();
  }, [symbol, type]);

  const totalAPR = useMemo(() => {
    if (apr === undefined) return undefined;
    return (
      apr +
      native +
      (type === 'deposit' || hideMarket ? 1 : -1) *
        (rates && rates[symbol]
          ? rates[symbol]?.reduce(
              (acc, curr) => acc + Number(type === 'deposit' ? curr.floatingDeposit : curr.borrow) / 1e18,
              0,
            )
          : 0)
    );
  }, [apr, hideMarket, native, rates, symbol, type]);

  const _rates = useMemo(() => {
    return (
      rates &&
      rates[symbol] &&
      rates[symbol]
        ?.map((r) => ({
          symbol: r.assetSymbol,
          apr: Number(type === 'deposit' ? r.floatingDeposit : r.borrow) / 1e18,
        }))
        .filter((r) => r.apr > 0)
    );
  }, [rates, symbol, type]);

  return (
    <APRWithBreakdown
      directionMobile={directionMobile}
      iconsSize={iconsSize}
      markets={hideMarket ? [] : [{ apr, symbol }]}
      rewards={_rates}
      natives={symbol === 'wstETH' && type === 'deposit' ? [{ symbol: 'wstETH', apr: native }] : undefined}
    >
      <Typography sx={sx}>
        {!isLoading && totalAPR !== undefined ? (
          `${
            totalAPR > 999
              ? '∞'
              : toPercentage(type === 'borrow' ? totalAPR : totalAPR < minAPRValue ? undefined : totalAPR)
          }${label ? ' ' + label : ''}`
        ) : (
          <Skeleton width={70} />
        )}
      </Typography>
    </APRWithBreakdown>
  );
};

export default React.memo(Rates);
