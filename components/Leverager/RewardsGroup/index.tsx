import { Avatar, AvatarGroup } from '@mui/material';
import { useLeveragerContext } from 'contexts/LeveragerContext';
import React, { FC } from 'react';

type RewardsGroupProps = {
  withNative?: boolean;
  withRewards?: boolean;
  size?: number;
};

const RewardsGroup: FC<RewardsGroupProps> = ({ withNative = true, withRewards = true, size = 20 }) => {
  const { nativeRewards, marketRewards } = useLeveragerContext();

  const all = [...(withRewards ? marketRewards : []), ...(withNative ? nativeRewards : [])];

  return (
    <AvatarGroup max={6} sx={{ '& .MuiAvatar-root': { width: size, height: size, fontSize: 10 } }}>
      {all.map((rewardSymbol) => (
        <Avatar key={rewardSymbol} alt={rewardSymbol} src={`/img/assets/${rewardSymbol}.svg`} />
      ))}
    </AvatarGroup>
  );
};

export default RewardsGroup;
