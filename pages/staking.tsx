import React from 'react';
import type { NextPage } from 'next';
import { Box, Button, Typography, useTheme } from '@mui/material';
import Image from 'next/image';
import { t } from 'i18next';
import { useModal } from 'contexts/ModalContext';
import StakedEXASummary from 'components/staking/StakedEXASummary';
import StakingOperations from 'components/staking/StakingOperations';
import StakeChart from 'components/charts/StakeChart';
import Progress from 'components/staking/Progress';
import { StakeEXAProvider } from 'contexts/StakeEXAContext';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import useEtherscanLink from 'hooks/useEtherscanLink';
import { useStakedEXA } from 'hooks/useStakedEXA';

const Staking: NextPage = () => {
  const { open: openGetEXA } = useModal('get-exa');
  const { palette } = useTheme();
  const { address } = useEtherscanLink();
  const stakedEXA = useStakedEXA();

  return (
    <StakeEXAProvider>
      <Box display="flex" flexDirection="column" gap={3} maxWidth={800} mx="auto" my={5}>
        <Box display="flex" flexDirection="column" gap={3}>
          <Box display="flex" justifyContent="space-between">
            <Box display="flex" gap={1} alignItems="center">
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
              {stakedEXA && (
                <Button
                  id="view"
                  component="a"
                  href={address(stakedEXA.address)}
                  target="_blank"
                  rel="noreferrer noopener"
                  sx={{
                    bgcolor: palette.mode === 'light' ? 'figma.grey.100' : 'grey.100',
                    py: 0.5,
                    px: 1,
                  }}
                >
                  <Box display="flex" alignItems="center" gap={0.5}>
                    <Typography
                      fontSize={10}
                      fontWeight={500}
                      fontFamily="IBM Plex Mono"
                      color={palette.mode === 'light' ? 'figma.grey.600' : 'grey.900'}
                      textTransform="uppercase"
                    >
                      {t('View on Etherscan')}
                    </Typography>
                    <OpenInNewIcon
                      sx={{
                        height: '10px',
                        width: '10px',
                        color: palette.mode === 'light' ? 'figma.grey.600' : 'grey.900',
                      }}
                    />
                  </Box>
                </Button>
              )}
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
                'The EXA staking period is twelve months. You can add more EXA, claim fees, or unstake anytime. Early or late withdrawal will reduce your eligible rewards. Keep your EXA staked for the entire period to receive the full treasury fees. For more information, please check ',
              )}
              <Typography sx={{ textDecoration: 'underline' }} component="span">
                <a
                  target="_blank"
                  rel="noreferrer noopener"
                  href="https://docs.exact.ly/governance/exactly-token-exa/exa-staking-program-stexa"
                >
                  {t('our docs.')}
                </a>
              </Typography>
            </Typography>
          </Box>
        </Box>
        <StakedEXASummary />
        <StakingOperations />
        <Progress />
        <StakeChart />
      </Box>
    </StakeEXAProvider>
  );
};

export default Staking;
