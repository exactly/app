import React, { useCallback, useState } from 'react';
import type { NextPage } from 'next';

import { usePageView } from 'hooks/useAnalytics';
import { useTranslation } from 'react-i18next';
import { Box, Button, Divider, Grid, Typography } from '@mui/material';
import VestingInput from 'components/VestingInput';
import ActiveStream from 'components/ActiveStream';
import { useUpdateStreams, useEscrowedEXA } from 'hooks/useEscrowedEXA';
import { useWeb3 } from 'hooks/useWeb3';
import { useNetwork, useSwitchNetwork } from 'wagmi';
import { LoadingButton } from '@mui/lab';
import { waitForTransaction } from '@wagmi/core';

const Vesting: NextPage = () => {
  usePageView('/vesting', 'Vesting');
  const { t } = useTranslation();
  const { impersonateActive, chain: displayNetwork, opts } = useWeb3();
  const { chain } = useNetwork();
  const { activeStreams, loading: streamsLoading } = useUpdateStreams();
  const { switchNetwork, isLoading: switchIsLoading } = useSwitchNetwork();

  const [loading, setLoading] = useState<boolean>(false);
  const escrowedEXA = useEscrowedEXA();

  const handleClick = useCallback(async () => {
    if (!activeStreams || !escrowedEXA || !opts) return;
    setLoading(true);
    try {
      const tx = await escrowedEXA.write.withdrawMax([activeStreams.map(({ tokenId }) => BigInt(tokenId))], opts);
      await waitForTransaction({ hash: tx });
    } catch {
      // if request fails, don't do anything
    } finally {
      setLoading(false);
    }
  }, [activeStreams, escrowedEXA, opts]);

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
          <Grid item xs={6} display="flex" justifyContent="center" alignItems="center">
            <VestingInput />
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

      {streamsLoading && <Box>loading...</Box>}

      {activeStreams.length > 0 && !streamsLoading && (
        <Box
          borderRadius="8px"
          bgcolor="components.bg"
          boxShadow={({ palette }) => (palette.mode === 'light' ? '0px 3px 4px 0px rgba(97, 102, 107, 0.25)' : '')}
        >
          <Box borderRadius="8px" bgcolor="components.bg">
            <Box display="flex" flexDirection="column" gap={4} px={4} py={3.5} pb={3}>
              <Box display="flex" alignItems="center" justifyContent="space-between" gap={3}>
                <Box display="flex" alignItems="center" gap={3}>
                  <Box display="flex" flexDirection="column" gap={0.5}>
                    <Typography fontSize={14} fontWeight={500}>
                      {t('You can claim all streams at once.')}
                    </Typography>
                  </Box>
                </Box>
                <Box display="flex" flexDirection="column" gap={2} alignItems="center">
                  {impersonateActive ? (
                    <Button fullWidth variant="contained">
                      {t('Exit Read-Only Mode')}
                    </Button>
                  ) : chain && chain.id !== displayNetwork.id ? (
                    <LoadingButton
                      fullWidth
                      onClick={() => switchNetwork?.(displayNetwork.id)}
                      variant="contained"
                      loading={switchIsLoading}
                    >
                      {t('Please switch to {{network}} network', { network: displayNetwork.name })}
                    </LoadingButton>
                  ) : (
                    <>
                      <LoadingButton fullWidth variant="contained" onClick={handleClick} loading={loading}>
                        {t('Claim All')}
                      </LoadingButton>
                    </>
                  )}
                </Box>
              </Box>
            </Box>
          </Box>
          <Divider />
          {activeStreams.map(
            ({ id, tokenId, depositAmount, withdrawnAmount, startTime, endTime, cancelable }, index) => (
              <>
                <ActiveStream
                  key={id}
                  tokenId={Number(tokenId)}
                  depositAmount={BigInt(depositAmount)}
                  withdrawnAmount={BigInt(withdrawnAmount)}
                  startTime={Number(startTime)}
                  endTime={Number(endTime)}
                  cancellable={cancelable}
                />
                {index !== activeStreams.length - 1 && <Divider key={`divider-${tokenId}`} />}
              </>
            ),
          )}
        </Box>
      )}

      {activeStreams.length === 0 && !streamsLoading && (
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
      )}
    </Box>
  );
};

export default Vesting;
