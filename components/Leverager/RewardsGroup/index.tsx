import { Avatar, AvatarGroup } from '@mui/material';
import { useLeveragerContext } from 'contexts/LeveragerContext';
import React, { FC } from 'react';

type RewardsGroupProps = {
  withMarket?: boolean;
  withNative?: boolean;
  withRewards?: boolean;
  size?: number;
};

const RewardsGroup: FC<RewardsGroupProps> = ({
  withMarket = true,
  withNative = true,
  withRewards = true,
  size = 20,
}) => {
  const {
    input: { collateralSymbol = 'USDC', borrowSymbol = 'USDC' },
    nativeRewards,
    marketRewards,
  } = useLeveragerContext();

  const all = [
    ...new Set([
      ...(withMarket ? [collateralSymbol, borrowSymbol] : []),
      ...(withRewards ? marketRewards : []),
      ...(withNative ? nativeRewards : []),
    ]),
  ];

  return (
    <AvatarGroup
      max={6}
      sx={{ '& .MuiAvatar-root': { width: size, height: size, fontSize: 10, borderColor: 'transparent' } }}
    >
      {all.map((rewardSymbol) => (
        <Avatar key={rewardSymbol} alt={rewardSymbol} src={`/img/assets/${rewardSymbol}.svg`} />
      ))}
    </AvatarGroup>
  );
};

export default RewardsGroup;
