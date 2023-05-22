import React, { FC } from 'react';
import { Box, Divider, Typography, useMediaQuery, useTheme } from '@mui/material';
import StarsIcon from '@mui/icons-material/Stars';
import formatNumber from 'utils/formatNumber';
import Image from 'next/image';
import ButtonWithDropdown from 'components/common/ButtonWithDropdown';

type RewardProps = {
  assetSymbol: string;
  amount: number;
  amountInUSD: number;
};

const Reward: FC<RewardProps> = ({ assetSymbol, amount, amountInUSD }) => {
  const { breakpoints } = useTheme();
  const isMobile = useMediaQuery(breakpoints.down('lg'));

  return (
    <Box display="flex" flexDirection={{ xs: 'column', lg: 'row' }} gap={0.5}>
      <Box display="flex" alignItems="center" gap={0.5}>
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
        <Typography variant={isMobile ? 'dashboardOverviewAmount' : 'dashboardMainTitle'}>{amount}</Typography>
      </Box>
      <Box display="flex" alignItems="center" gap={0.5}>
        {isMobile && <Box width={32} height={32} />}
        <Typography variant="dashboardSubtitleNumber">{`$${formatNumber(amountInUSD, 'USD', true)}`}</Typography>
      </Box>
    </Box>
  );
};

const UserRewards = () => {
  const { breakpoints } = useTheme();
  const isMobile = useMediaQuery(breakpoints.down('lg'));

  return (
    <Box
      display="flex"
      flexDirection={{ xs: 'column', lg: 'row' }}
      justifyContent={{ xs: 'none', lg: 'space-between' }}
      alignItems={{ xs: 'none', lg: 'center' }}
      py={{ xs: 4, lg: 2 }}
      px={4}
      gap={3}
      borderRadius="8px"
      boxSizing="border-box"
      bgcolor="#FFFFFF"
      height={{ xs: '235px', lg: '64px' }}
    >
      <Box display="flex" alignItems="center" justifyContent="space-between">
        <Box display="flex" gap={1} alignItems="center">
          <StarsIcon sx={{ fontSize: 16 }} />
          <Typography variant="dashboardTitle" noWrap>
            Your Rewards
          </Typography>
        </Box>
        {isMobile && (
          <Typography variant="dashboardMainSubtitle" textTransform="uppercase" noWrap sx={{ cursor: 'pointer' }}>
            Learn More
          </Typography>
        )}
      </Box>
      <Box display="flex" gap={{ xs: 2, lg: 1 }} alignItems="center" mb={{ xs: 1, lg: 0 }}>
        <Reward assetSymbol="USDC" amount={932} amountInUSD={2575.48} />
        <Divider orientation="vertical" flexItem />
        <Reward assetSymbol="OP" amount={349} amountInUSD={689.56} />
      </Box>
      <ButtonWithDropdown fullWidth={isMobile}>Claim</ButtonWithDropdown>
    </Box>
  );
};

export default UserRewards;
