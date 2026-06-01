import React, { FC, useMemo } from 'react';
import { Box, Button, Typography } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { zeroAddress } from 'viem';
import { stakingPreviewerAddress, useReadStakingPreviewerStaking } from 'generated/wagmi';
import { defaultChain } from 'utils/client';
import useReadOnly from 'hooks/useReadOnly';
import { useEXAPrice } from 'hooks/useEXA';
import usePreviewerExactly from 'hooks/usePreviewerExactly';
import Image from 'next/image';
import formatNumber from 'utils/formatNumber';
import Link from 'next/link';
import { calculateStakingRewardsAPR, calculateTotalStakingRewardsAPR } from 'utils/calculateStakingAPR';

const stakingPreviewerChainId = Object.keys(stakingPreviewerAddress)
  .map(Number)
  .find((chainId): chainId is keyof typeof stakingPreviewerAddress => chainId === defaultChain.id);

const StakingNavButton: FC = () => {
  const { t } = useTranslation();
  const { account } = useReadOnly();
  const { data } = useReadStakingPreviewerStaking({
    chainId: stakingPreviewerChainId,
    args: [account ?? zeroAddress],
    query: { enabled: stakingPreviewerChainId !== undefined, staleTime: 5_000 },
  });
  const totalAssets = data?.totalAssets;
  const rewards = data?.rewards;
  const exaPrice = useEXAPrice();
  const { data: accountData } = usePreviewerExactly();

  const rewardsAPR = useMemo(() => {
    return calculateStakingRewardsAPR(totalAssets, rewards, accountData, exaPrice);
  }, [totalAssets, rewards, accountData, exaPrice]);

  const totalRewardsAPR = useMemo(() => {
    return calculateTotalStakingRewardsAPR(rewardsAPR);
  }, [rewardsAPR]);

  return (
    <Link href={{ pathname: '/staking' }}>
      <Button variant="outlined">
        <Box display="flex" gap={0.5} alignItems="center">
          <Typography fontSize={14} fontWeight={700}>
            {t('Stake')}
          </Typography>
          <Image
            src={`/img/assets/EXA.svg`}
            alt=""
            width={16}
            height={16}
            style={{ maxWidth: '100%', height: 'auto' }}
          />
          <Typography fontSize={14} fontWeight={500}>
            {formatNumber(Number(totalRewardsAPR))}%
          </Typography>
        </Box>
      </Button>
    </Link>
  );
};

export default StakingNavButton;
