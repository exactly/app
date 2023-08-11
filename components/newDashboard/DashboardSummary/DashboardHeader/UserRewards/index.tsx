import React, { FC, useMemo } from 'react';
import { formatUnits } from 'viem';
import { Box, Skeleton, Typography, useMediaQuery, useTheme } from '@mui/material';
import StarsIcon from '@mui/icons-material/Stars';
import formatNumber from 'utils/formatNumber';
import Image from 'next/image';
import { useTranslation } from 'react-i18next';
import useRewards from 'hooks/useRewards';
import { WEI_PER_ETHER } from 'utils/const';
import { LoadingButton } from '@mui/lab';
import { useWeb3 } from 'hooks/useWeb3';
import { useModal } from 'contexts/ModalContext';

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
    <Box display="flex" flexDirection={{ xs: xsDirection, lg: 'row' }} gap={2} sx={{ flexWrap: 'wrap' }}>
      <Box display="flex" alignItems="center" gap={1}>
        <Image
          src={`/img/assets/${assetSymbol}.svg`}
          alt={assetSymbol}
          width={isMobile ? 32 : 24}
          height={isMobile ? 32 : 24}
          style={{
            maxWidth: '100%',
            height: 'auto',
          }}
        />
        <Typography fontSize={28}>{amountInUSD ? `$${amountInUSD}` : amount}</Typography>
      </Box>
    </Box>
  );
};

const UserRewards = () => {
  const { t } = useTranslation();
  const { impersonateActive } = useWeb3();
  const { breakpoints } = useTheme();
  const isMobile = useMediaQuery(breakpoints.down('lg'));
  const { rewards: rs, rates, claimable, isLoading } = useRewards();
  const { open } = useModal('rewards');

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
        <Typography variant="dashboardTitle">{t('Rewards')}</Typography>
      </Box>

      <Box
        display="flex"
        flexDirection={{ xs: 'column', lg: 'row' }}
        gap={{ xs: 1, lg: 2 }}
        alignItems={{ xs: 'none', lg: 'center' }}
        mx={rewards && rewards.length > 1 ? 0 : 'auto'}
        mb={{ xs: 0.5, lg: 0 }}
      >
        {rewards ? (
          rewards.map(({ assetSymbol, amount, amountInUSD }) => (
            <Box key={`${assetSymbol}_${amount}_${amountInUSD}`} display="flex" gap={2} alignItems="center">
              <Reward
                assetSymbol={assetSymbol}
                amount={amount}
                amountInUSD={amountInUSD}
                xsDirection={rewards.length > 1 ? 'column' : 'row'}
              />
            </Box>
          ))
        ) : (
          <Skeleton width={96} height={32} />
        )}
      </Box>

      <LoadingButton
        variant="contained"
        fullWidth={isMobile}
        sx={{ px: 3 }}
        disabled={isLoading || !claimable || impersonateActive}
        onClick={open}
        loading={isLoading}
      >
        {t('Claim')}
      </LoadingButton>
    </Box>
  );
};

export default UserRewards;
