import React, { FC, useCallback, useMemo } from 'react';
import { Box, Button, Divider, Skeleton, Typography, useMediaQuery, useTheme } from '@mui/material';
import StarsIcon from '@mui/icons-material/Stars';
import formatNumber from 'utils/formatNumber';
import Image from 'next/image';
import { useTranslation } from 'react-i18next';
import useRewards from 'hooks/useRewards';
import { BigNumber, formatFixed } from '@ethersproject/bignumber';
import { WeiPerEther } from '@ethersproject/constants';

type RewardProps = {
  assetSymbol: string;
  amount: string;
  amountInUSD?: string;
  xsDirection?: 'row' | 'column';
};

const Reward: FC<RewardProps> = ({ assetSymbol, amount, amountInUSD, xsDirection = 'column' }) => {
  const { breakpoints } = useTheme();
  const isMobile = useMediaQuery(breakpoints.down('lg'));

  return (
    <Box
      display="flex"
      flexDirection={{ xs: xsDirection, lg: 'row' }}
      gap={{ xs: xsDirection === 'column' ? 0 : 1, lg: 1 }}
      sx={{ flexWrap: 'wrap' }}
    >
      <Box display="flex" alignItems="center" gap={1}>
        <Image
          src={`/img/assets/${assetSymbol}.svg`}
          alt={assetSymbol}
          width={isMobile ? 32 : 15}
          height={isMobile ? 32 : 15}
          style={{
            maxWidth: '100%',
            height: 'auto',
          }}
        />
        <Typography variant={isMobile ? 'dashboardOverviewAmount' : 'h6'}>{amount}</Typography>
      </Box>
      <Box display="flex" alignItems="center" gap={1}>
        {isMobile && xsDirection === 'column' && <Box width={32} height={32} />}
        {amountInUSD && <Typography variant="dashboardSubtitleNumber">${amountInUSD}</Typography>}
      </Box>
    </Box>
  );
};

const UserRewards = () => {
  const { t } = useTranslation();
  const { breakpoints } = useTheme();
  const isMobile = useMediaQuery(breakpoints.down('lg'));
  const { rewards: rs, rates, claimable, claim, isLoading } = useRewards();

  const rewards = useMemo(() => {
    if (!Object.keys(rates).length) return undefined;

    const ratesPerAsset = Object.values(rates)
      .flatMap((r) => r)
      .flatMap((r) => ({ assetSymbol: r.assetSymbol, usdPrice: r.usdPrice }))
      .reduce((acc: Record<string, BigNumber>, { assetSymbol, usdPrice }) => {
        if (!acc[assetSymbol]) {
          acc[assetSymbol] = usdPrice;
        }
        return acc;
      }, {});

    return Object.entries(rs)
      .map(([assetSymbol, amount]) => ({
        assetSymbol,
        amount: formatNumber(formatFixed(amount, 18)),
        amountInUSD: ratesPerAsset[assetSymbol]
          ? formatNumber(formatFixed(amount.mul(ratesPerAsset[assetSymbol]).div(WeiPerEther), 18), 'noDecimals')
          : undefined,
      }))
      .filter(({ amountInUSD }) => amountInUSD !== '0');
  }, [rates, rs]);

  const onClickClaim = useCallback(async () => await claim(), [claim]);

  return (
    <Box
      display="flex"
      flexDirection={{ xs: 'column', lg: 'row' }}
      justifyContent={{ xs: 'none', lg: 'space-between' }}
      alignItems={{ xs: 'none', lg: 'center' }}
      py={{ xs: 4, lg: 2 }}
      px={4}
      gap={{ xs: 3.5, lg: rewards && rewards.length > 1 ? 3 : 2 }}
      borderRadius="8px"
      boxSizing="border-box"
      bgcolor="components.bg"
      minHeight={{ lg: '64px' }}
      maxHeight={{ xs: '233px', lg: '64px' }}
    >
      <Box display="flex" alignItems="center" justifyContent="space-between">
        <Box display="flex" gap={1} alignItems="center">
          <StarsIcon sx={{ fontSize: 16 }} />
          <Typography variant="dashboardTitle">{t('Rewards')}</Typography>
        </Box>
        {isMobile && (
          <Typography variant="dashboardMainSubtitle" textTransform="uppercase" noWrap sx={{ cursor: 'pointer' }}>
            {t('Learn More')}
          </Typography>
        )}
      </Box>

      <Box
        display="flex"
        gap={{ xs: 3, lg: 2 }}
        alignItems="center"
        mx={rewards && rewards.length > 1 ? 0 : 'auto'}
        mb={{ xs: 0.5, lg: 0 }}
      >
        {rewards ? (
          rewards.map(({ assetSymbol, amount, amountInUSD }, index) => (
            <Box
              key={`${assetSymbol}_${amount}_${amountInUSD}`}
              display="flex"
              gap={{ xs: 3, lg: 2 }}
              alignItems="center"
            >
              <Reward
                assetSymbol={assetSymbol}
                amount={amount}
                amountInUSD={amountInUSD}
                xsDirection={rewards.length > 1 ? 'column' : 'row'}
              />
              {index !== rewards.length - 1 && (
                <Divider orientation="vertical" flexItem variant={isMobile ? 'middle' : undefined} />
              )}
            </Box>
          ))
        ) : (
          <Skeleton width={96} height={32} />
        )}
      </Box>

      <Button
        variant="contained"
        fullWidth={isMobile}
        sx={{ px: 3 }}
        disabled={isLoading || !claimable}
        onClick={onClickClaim}
      >
        {t('Claim')}
      </Button>
    </Box>
  );
};

export default UserRewards;
