import React, { FC, useCallback, useMemo } from 'react';
import { formatUnits } from 'viem';
import { Box, Button, Skeleton, Typography, useMediaQuery, useTheme } from '@mui/material';
import StarsIcon from '@mui/icons-material/Stars';
import Link from 'next/link';
import formatNumber from 'utils/formatNumber';
import Image from 'next/image';
import { useTranslation } from 'react-i18next';
import useRewards from 'hooks/useRewards';
import { WEI_PER_ETHER } from 'utils/const';
import useAccountData from 'hooks/useAccountData';
import useRouter from 'hooks/useRouter';
import { track } from 'utils/mixpanel';

type RewardProps = {
  assetSymbol: string;
  amount: string;
  amountInUSD?: string;
  xsDirection?: 'row' | 'column';
  dense: boolean;
};

const Reward: FC<RewardProps> = ({ assetSymbol, amount, amountInUSD, xsDirection = 'column', dense }) => {
  const { breakpoints } = useTheme();
  const isMobile = useMediaQuery(breakpoints.down('lg'));

  return (
    <Box display="flex" flexDirection={{ xs: xsDirection, lg: 'row' }} gap={2} sx={{ flexWrap: 'wrap' }}>
      <Box display="flex" alignItems="center" gap={1}>
        <Image
          src={`/img/assets/${assetSymbol}.svg`}
          alt={assetSymbol}
          width={isMobile ? 32 : dense ? 20 : 24}
          height={isMobile ? 32 : dense ? 20 : 24}
          style={{
            maxWidth: '100%',
            height: 'auto',
          }}
        />
        <Typography fontSize={dense ? 19 : 28}>{amountInUSD ? `$${amountInUSD}` : amount}</Typography>
      </Box>
    </Box>
  );
};

const UserRewards = () => {
  const { t } = useTranslation();
  const { isFetching } = useAccountData();
  const { rewards: rs, rates } = useRewards();
  const { query } = useRouter();

  const rewards = useMemo(() => {
    if (!Object.keys(rates).length) return undefined;

    const ratesPerAsset = Object.values(rates)
      .flatMap((r) => r)
      .flatMap((r) => ({ assetSymbol: r.assetSymbol, usdPrice: r.usdPrice }))
      .reduce((acc: Record<string, bigint>, { assetSymbol, usdPrice }) => {
        if (!acc[assetSymbol]) {
          acc[assetSymbol] = usdPrice;
        }
        return acc;
      }, {});

    return Object.entries(rs).map(([assetSymbol, { amount }]) => {
      const _amountInUSD = ratesPerAsset[assetSymbol]
        ? (amount * ratesPerAsset[assetSymbol]) / WEI_PER_ETHER
        : undefined;

      return {
        assetSymbol,
        amount: formatNumber(formatUnits(amount, 18)),
        amountInUSD: _amountInUSD
          ? formatNumber(formatUnits(_amountInUSD, 18), _amountInUSD < WEI_PER_ETHER ? 'USD' : 'noDecimals')
          : undefined,
      };
    });
  }, [rates, rs]);

  const trackClick = useCallback(() => {
    track('Button Clicked', {
      name: 'vest',
      location: 'Dashboard',
      href: '/vesting',
    });
  }, []);

  return (
    <Box
      display="flex"
      flexDirection={{ xs: 'column' }}
      justifyContent={{ xs: 'none', lg: 'space-between' }}
      p={4}
      gap={{ xs: 3, lg: 2 }}
      borderRadius="8px"
      boxSizing="border-box"
      bgcolor="components.bg"
      height="100%"
    >
      <Box display="flex" gap={1} alignItems="center">
        <StarsIcon sx={{ fontSize: 16 }} />
        <Typography variant="dashboardTitle">{t('esEXA Vesting')}</Typography>
      </Box>

      <Box
        display="flex"
        flexDirection={{ xs: 'column', lg: 'row' }}
        gap={{ xs: 1, lg: 2 }}
        alignItems={{ xs: 'none', lg: 'center' }}
        mb={{ xs: 0.5, lg: 0 }}
      >
        {!isFetching && rewards ? (
          rewards.map(
            ({ assetSymbol, amount, amountInUSD }) =>
              assetSymbol === 'esEXA' && (
                <Box key={`${assetSymbol}_${amount}_${amountInUSD}`} display="flex" gap={2} alignItems="center">
                  <Reward
                    assetSymbol={assetSymbol}
                    amount={amount}
                    amountInUSD={amountInUSD}
                    xsDirection={rewards.length > 1 ? 'column' : 'row'}
                    dense={false}
                  />
                </Box>
              ),
          )
        ) : (
          <Skeleton width={120} height={42} />
        )}
      </Box>

      <Link href={{ pathname: '/vesting', query }} style={{ width: '100%' }}>
        <Button fullWidth variant="contained" onClick={trackClick}>
          {t('Vest esEXA')}
        </Button>
      </Link>
    </Box>
  );
};

export default UserRewards;
