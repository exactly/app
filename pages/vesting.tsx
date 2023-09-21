import React from 'react';
import type { NextPage } from 'next';

import { usePageView } from 'hooks/useAnalytics';
import { useTranslation } from 'react-i18next';
import { Box, Button, Divider, Grid, Typography } from '@mui/material';

const Vesting: NextPage = () => {
  usePageView('/vesting', 'Vesting');
  const { t } = useTranslation();

  return (
    <Box display="flex" flexDirection="column" gap={6} maxWidth={800} mx="auto" my={5}>
      <Box display="flex" flexDirection="column" gap={3}>
        <Typography fontSize={24} fontWeight={700}>
          {t('esEXA Vesting Program')}
        </Typography>
        <Box display="flex" flexDirection="column" gap={1}>
          <Typography>
            {t(
              "We've created the esEXA Vesting Program to reward the Protocol’s active participants. Whenever you use the Protocol, you'll receive esEXA tokens that you can vest to earn EXA.",
            )}
          </Typography>
          <Typography>
            {t(
              'In just two simple steps, you can start unlocking EXA tokens while contributing to the growth and improvement of the Protocol.',
            ) + ' '}
            <Typography sx={{ textDecoration: 'underline' }} component="span">
              <a target="_blank" rel="noreferrer noopener" href="https://docs.exact.ly/">
                {t('Learn more about the esEXA Vesting Program.')}
              </a>
            </Typography>
          </Typography>
        </Box>
      </Box>
      <Box
        display="flex"
        flexDirection="column"
        width="100%"
        gap={4}
        p={4}
        borderRadius="16px"
        bgcolor="components.bg"
        boxShadow={({ palette }) => (palette.mode === 'light' ? '0px 3px 4px 0px rgba(97, 102, 107, 0.25)' : '')}
      >
        <Grid container spacing={3}>
          <Grid item xs={6} display="flex" flexDirection="column" justifyContent="center" gap={0.5}>
            <Typography textTransform="uppercase" fontSize={14}>
              {t('Step {{number}}', { number: 1 })}
            </Typography>
            <Typography variant="h6">{t('Claim your esEXA Rewards')}</Typography>
          </Grid>
          <Grid item xs={6} display="flex" alignItems="center">
            <Button variant="contained" fullWidth>
              {t('Claim {{amount}} esEXA', { amount: 218.46 })}
            </Button>
          </Grid>
        </Grid>
        <Divider flexItem />
        <Grid container spacing={3}>
          <Grid item xs={6} display="flex" flexDirection="column" justifyContent="center" gap={0.5}>
            <Typography textTransform="uppercase" fontSize={14}>
              {t('Step {{number}}', { number: 2 })}
            </Typography>
            <Typography variant="h6">{t('Initiate Vesting Your esEXA')}</Typography>
            <Typography>
              {t(
                "You'll need to deposit 10% of the total esEXA you want to vest as an EXA reserve. You can get EXA if you don’t have the required amount.",
              )}
            </Typography>
          </Grid>
          {/* Replace with Vesting Component */}
          <Grid item xs={6} display="flex" justifyContent="center" alignItems="center">
            Vesting Component
          </Grid>
        </Grid>
      </Box>
      <Divider flexItem sx={{ my: 2 }} />
      <Box display="flex" flexDirection="column" gap={3}>
        <Typography fontSize={24} fontWeight={700}>
          {t('Active Vesting Streams')}
        </Typography>
        <Typography>
          {t(
            'Here, you can monitor all your active vesting streams, allowing you to easily track your current EXA earnings. Each vesting stream is represented by an NFT and comes with a 12-month vesting period.',
          )}
        </Typography>
      </Box>
      <Box
        display="flex"
        flexDirection="column"
        justifyContent="center"
        alignItems="center"
        border={({ palette }) => `1px solid ${palette.grey[300]}`}
        borderRadius="6px"
        py={13}
        px={5}
        gap={1}
      >
        <Typography fontWeight={700} fontSize={16}>
          {t('No vesting streams active yet.')}
        </Typography>
        <Typography textAlign="center" fontSize={14} color="figma.grey.500">
          {t('Start vesting your esEXA and see the streams’ details here.')}
        </Typography>
      </Box>
    </Box>
  );
};

export default Vesting;
