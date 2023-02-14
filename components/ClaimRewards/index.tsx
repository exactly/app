import React, { type FC } from 'react';
import { LoadingButton } from '@mui/lab';

import { useWeb3 } from 'hooks/useWeb3';
import useRewards from 'hooks/useRewards';
import { globals } from 'styles/theme';
const { onlyDesktop } = globals;

const ClaimRewards: FC = () => {
  const { walletAddress } = useWeb3();

  const { claimable, claim, isLoading } = useRewards();

  if (!walletAddress || !claimable) {
    return null;
  }

  return (
    <LoadingButton
      variant="contained"
      onClick={claim}
      disabled={isLoading}
      loading={isLoading}
      sx={{ display: onlyDesktop }}
    >
      Claim rewards
    </LoadingButton>
  );
};

export default React.memo(ClaimRewards);
