import { Skeleton, Typography } from '@mui/material';
import APRWithBreakdown from 'components/APRWithBreakdown';
import React, { FC, useEffect, useMemo, useState } from 'react';
import { toPercentage } from 'utils/utils';
import numbers from 'config/numbers.json';
import { LidoResponse } from 'hooks/useStETHNativeAPR';
import usePreviewerExactly from 'hooks/usePreviewerExactly';
import { parseEther } from 'viem';

type Props = {
  symbol: string;
  type: 'deposit' | 'borrow';
  apr?: number;
  label?: string;
  sx?: React.ComponentProps<typeof Typography>['sx'];
  directionMobile?: 'row' | 'row-reverse';
  directionDesktop?: 'row' | 'row-reverse';
  iconsSize?: number;
  isLoading?: boolean;
  hideMarket?: boolean;
  rateType?: 'fixed' | 'floating';
};

const { minAPRValue } = numbers;

const Rates: FC<Props> = ({
  symbol,
  type,
  apr,
  label,
  sx = { fontSize: 16, fontWeight: 700 },
  directionMobile,
  directionDesktop,
  iconsSize,
  isLoading = false,
  hideMarket = false,
  rateType = 'floating',
}) => {
  const { data } = usePreviewerExactly();

  const rewardRates = useMemo(() => {
    const marketAccount = data?.find((m) => m.assetSymbol === symbol);
    if (!marketAccount) return undefined;
    const min = parseEther('0.00005');
    return marketAccount.rewardRates
      .filter(
        ({ assetSymbol, borrow, floatingDeposit }) => assetSymbol !== '' && (borrow >= min || floatingDeposit >= min),
      )
      .map(({ borrow, floatingDeposit, ...reward }) => ({
        ...reward,
        floatingDeposit: floatingDeposit < min ? 0n : floatingDeposit,
        borrow: borrow < min ? 0n : borrow,
      }));
  }, [data, symbol]);

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

  const rewardRate = useMemo(() => {
    return (
      native +
      (rewardRates
        ? rewardRates.reduce(
            (acc, curr) => acc + Number(type === 'deposit' ? curr.floatingDeposit : curr.borrow) / 1e18,
            0,
          )
        : 0)
    );
  }, [type, native, rewardRates]);

  const _rates = useMemo(() => {
    return (
      rewardRates &&
      rewardRates
        .map((r) => ({
          symbol: r.assetSymbol,
          apr: Number(type === 'deposit' ? r.floatingDeposit : r.borrow) / 1e18,
        }))
        .filter((r) => r.apr > 0)
    );
  }, [rewardRates, type]);

  if (rateType === 'fixed' && type === 'deposit') {
    return (
      <Typography sx={sx}>
        {!isLoading && apr !== undefined ? (
          `${hideMarket ? '' : apr > 999 ? '∞' : toPercentage(apr < minAPRValue ? undefined : apr)}${
            label ? ' ' + label : ''
          }`
        ) : (
          <Skeleton width={70} />
        )}
      </Typography>
    );
  }

  return (
    <APRWithBreakdown
      directionMobile={directionMobile}
      directionDesktop={directionDesktop}
      iconsSize={iconsSize}
      markets={hideMarket ? [] : [{ apr, symbol }]}
      rewards={_rates}
      natives={symbol === 'wstETH' && type === 'deposit' ? [{ symbol: 'wstETH', apr: native }] : undefined}
      rewardAPR={rewardRate === 0 ? undefined : rewardRate > 999 ? '∞' : toPercentage(rewardRate)}
    >
      <Typography sx={sx}>
        {!isLoading && apr !== undefined ? (
          `${
            hideMarket
              ? ''
              : apr > 999
                ? '∞'
                : toPercentage(type === 'borrow' ? apr : apr < minAPRValue ? undefined : apr)
          }${label ? ' ' + label : ''}`
        ) : (
          <Skeleton width={70} />
        )}
      </Typography>
    </APRWithBreakdown>
  );
};

export default React.memo(Rates);
