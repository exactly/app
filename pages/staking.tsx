import React from 'react';
import type { NextPage } from 'next';
import { Box, Button, Typography } from '@mui/material';
import Image from 'next/image';
import { t } from 'i18next';
import { StakeEXAProvider } from 'contexts/StakeEXAContext';
import { useModal } from 'contexts/ModalContext';
import StakedEXASummary from 'components/staking/StakedEXASummary';
import StakingOperations from 'components/staking/StakingOperations';
import StakeChart from 'components/charts/StakeChart';
import StakingProgress from 'components/staking/StakingProgress';

const Staking: NextPage = () => {
  const { open: openGetEXA } = useModal('get-exa');

  return (
    <StakeEXAProvider>
      <Box display="flex" flexDirection="column" gap={3} maxWidth={800} mx="auto" my={5}>
        <Box display="flex" flexDirection="column" gap={3}>
          <Box display="flex" justifyContent="space-between">
            <Box display="flex" gap={1}>
              <Image
                src={`/img/assets/EXA.svg`}
                alt={'EXA'}
                width={32}
                height={32}
                style={{
                  maxWidth: '100%',
                  height: 'auto',
                }}
              />
              <Typography fontSize={24} fontWeight={700}>
                {t('EXA Staking')}
              </Typography>
            </Box>
            <Button
              variant="contained"
              sx={{ paddingX: '40px' }}
              onClick={() => {
                openGetEXA();
              }}
            >
              {t('Get EXA')}
            </Button>
          </Box>
          <Box display="flex" flexDirection="column" gap={1}>
            <Typography>
              {t(
                'EXA holders can now stake their assets and receive rewards. You have the flexibility to withdraw your assets anytime, but for optimal rewards, we recommend keeping your assets staked for six months. Early withdrawals are subject to penalties, and you will receive just a portion of the rewards earned so far.',
              )}
            </Typography>
            <Typography>
              {t('For further details on our staking program, ')}
              <Typography sx={{ textDecoration: 'underline' }} component="span">
                <a target="_blank" rel="noreferrer noopener" href="https://docs.exact.ly/">
                  {t('please check our documentation.')}
                </a>
              </Typography>
            </Typography>
          </Box>
        </Box>
        <StakedEXASummary />
        <StakingOperations />
        <StakeChart />
        <StakingProgress />
      </Box>
    </StakeEXAProvider>
  );
};

export default Staking;
