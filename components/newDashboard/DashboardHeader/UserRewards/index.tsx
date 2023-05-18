import React, { FC } from 'react';
import { Box, Divider, Typography } from '@mui/material';
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
  return (
    <Box display="flex" alignItems="center" gap={0.5}>
      <Image
        src={`/img/assets/${assetSymbol}.svg`}
        alt={assetSymbol}
        width={15}
        height={15}
        style={{
          maxWidth: '100%',
          height: 'auto',
        }}
      />
      <Typography variant="dashboardMainTitle">{amount}</Typography>
      <Typography variant="dashboardSubtitleNumber">{`$${formatNumber(amountInUSD, 'USD', true)}`}</Typography>
    </Box>
  );
};

const UserRewards = () => {
  return (
    <Box
      display="flex"
      justifyContent="space-between"
      alignItems="center"
      py={3}
      px={4}
      gap={3}
      borderRadius="8px"
      boxSizing="border-box"
      bgcolor="#FFFFFF"
      height="64px"
    >
      <Box display="flex" gap={1} alignItems="center">
        <StarsIcon sx={{ fontSize: 16 }} />
        <Typography variant="dashboardTitle" noWrap>
          Your Rewards
        </Typography>
      </Box>
      <Box display="flex" gap={1} alignItems="center">
        <Reward assetSymbol="USDC" amount={932} amountInUSD={2575.48} />
        <Divider orientation="vertical" flexItem />
        <Reward assetSymbol="OP" amount={349} amountInUSD={689.56} />
      </Box>
      <ButtonWithDropdown>Claim</ButtonWithDropdown>
    </Box>
  );
};

export default UserRewards;
