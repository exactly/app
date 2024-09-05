import React, { FC, useMemo } from 'react';
import { Box, Button, Typography } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { useStakeEXA } from 'contexts/StakeEXAContext';
import { useEXAPrice } from 'hooks/useEXA';
import useAccountData from 'hooks/useAccountData';
import Image from 'next/image';
import formatNumber from 'utils/formatNumber';
import Link from 'next/link';
import { calculateStakingRewardsAPR, calculateTotalStakingRewardsAPR } from 'utils/calculateStakingAPR';

const StakingNavButton: FC = () => {
  const { t } = useTranslation();
  const { totalAssets, rewards } = useStakeEXA();
  const exaPrice = useEXAPrice();
  const { accountData } = useAccountData();

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
