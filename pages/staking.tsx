import React from 'react';
import type { NextPage } from 'next';
import { Box, Button, Typography } from '@mui/material';
import Image from 'next/image';
import { t } from 'i18next';
import StakedEXASummary from 'components/staking/StakedEXASummary';
import StakeEXABoard from 'components/staking/StakeEXABoard';
import { useModal } from 'contexts/ModalContext';

const Staking: NextPage = () => {
  const { open: openGetEXA } = useModal('get-exa');

  return (
    <Box display="flex" flexDirection="column" gap={6} maxWidth={800} mx="auto" my={5}>
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
      <StakeEXABoard />
    </Box>
  );
};

export default Staking;
