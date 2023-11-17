import React, { useCallback, useMemo, useState } from 'react';
import type { NextPage } from 'next';

import { Trans, useTranslation } from 'react-i18next';
import { Box, Button, Divider, Grid, Skeleton, Typography } from '@mui/material';
import VestingInput from 'components/VestingInput';
import ActiveStream from 'components/ActiveStream';
import { useUpdateStreams, useEscrowedEXA, useEscrowedEXAReserveRatio } from 'hooks/useEscrowedEXA';
import { useWeb3 } from 'hooks/useWeb3';
import { useNetwork, useSwitchNetwork } from 'wagmi';
import { LoadingButton } from '@mui/lab';
import waitForTransaction from 'utils/waitForTransaction';
import useRewards from 'hooks/useRewards';
import { useModal } from 'contexts/ModalContext';
import formatNumber from 'utils/formatNumber';
import { formatEther } from 'viem';
import { toPercentage } from 'utils/utils';

const Vesting: NextPage = () => {
  const { t } = useTranslation();
  const { impersonateActive, chain: displayNetwork, opts } = useWeb3();
  const { chain } = useNetwork();
  const { activeStreams, loading: streamsLoading, refetch } = useUpdateStreams();
  const { switchNetwork, isLoading: switchIsLoading } = useSwitchNetwork();
  const { data: reserveRatio } = useEscrowedEXAReserveRatio();

  const [loading, setLoading] = useState<boolean>(false);
  const escrowedEXA = useEscrowedEXA();

  const { rewards } = useRewards();
  const { open: openRewards } = useModal('rewards');
  const { open: openGetEXA } = useModal('get-exa');

  const unclaimedTokens = useMemo(() => {
    return rewards['esEXA']?.amount || 0n;
  }, [rewards]);

  const handleClaimAll = useCallback(async () => {
    if (!activeStreams || !escrowedEXA || !opts) return;
    setLoading(true);
    try {
      const tx = await escrowedEXA.write.withdrawMax([activeStreams.map(({ tokenId }) => BigInt(tokenId))], opts);
      await waitForTransaction({ hash: tx });
    } catch {
      // if request fails, don't do anything
    } finally {
      setLoading(false);
      refetch();
    }
  }, [activeStreams, escrowedEXA, opts, refetch]);

  return (
    <Box display="flex" flexDirection="column" gap={6} maxWidth={800} mx="auto" my={5}>
      <Box display="flex" flexDirection="column" gap={3}>
        <Typography fontSize={24} fontWeight={700}>
          {t('esEXA Vesting Program')}
        </Typography>
        <Box display="flex" flexDirection="column" gap={1}>
          <Typography>
            {t(
              'The esEXA program provides rewards equivalent to EXA with a linear vesting period, ensuring that the Exactly protocol remains sustainable and rewarding for long-term community members.',
            )}
          </Typography>
          <Typography sx={{ textDecoration: 'underline' }} component="span">
            <a
              target="_blank"
              rel="noreferrer noopener"
              href="https://docs.exact.ly/governance/exactly-token-exa/escrowedexa-esexa"
            >
              {t('Learn more about the esEXA Vesting Program.')}
            </a>
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
          <Grid item xs={12} sm={6} display="flex" flexDirection="column" justifyContent="center" gap={0.5}>
            <Typography textTransform="uppercase" fontSize={14}>
              {t('Step {{number}}', { number: 1 })}
            </Typography>
            <Typography variant="h6">{t('Claim your esEXA Rewards')}</Typography>
          </Grid>
          <Grid item xs={12} sm={6} display="flex" alignItems="center">
            <Button variant="contained" fullWidth disabled={unclaimedTokens === 0n} onClick={openRewards}>
              {unclaimedTokens === 0n
                ? t('No esEXA to claim')
                : t('Claim {{amount}} esEXA', { amount: formatNumber(formatEther(unclaimedTokens)) })}
            </Button>
          </Grid>
        </Grid>
        <Divider flexItem />
        <Grid container spacing={3}>
          <Grid item xs={12} sm={6} display="flex" flexDirection="column" justifyContent="center" gap={0.5}>
            <Typography textTransform="uppercase" fontSize={14}>
              {t('Step {{number}}', { number: 2 })}
            </Typography>
            <Typography variant="h6">{t('Initiate the vesting of your esEXA')}</Typography>
            <Typography>
              {t('You must deposit {{reserveRatio}} of the total esEXA you want to vest as an EXA reserve.', {
                reserveRatio: toPercentage(reserveRatio !== undefined ? Number(reserveRatio) / 1e18 : 0.15, 0),
              })}
            </Typography>
            <Typography>
              <Trans
                i18nKey="You can <1>get EXA</1> if you don’t have the required reserve amount."
                components={{
                  1: (
                    <button
                      onClick={openGetEXA}
                      style={{
                        fontWeight: 700,
                        textDecoration: 'underline',
                        cursor: 'pointer',
                        padding: 'unset',
                        background: 'unset',
                        border: 'unset',
                        fontSize: 'unset',
                        color: 'unset',
                      }}
                    />
                  ),
                }}
              />
            </Typography>
          </Grid>
          <Grid item xs={12} sm={6} display="flex" justifyContent="center" alignItems="center">
            <VestingInput refetch={refetch} />
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

      {streamsLoading && <Skeleton height={150} />}

      {activeStreams.length > 0 && !streamsLoading && (
        <Box
          borderRadius="8px"
          bgcolor="components.bg"
          boxShadow={({ palette }) => (palette.mode === 'light' ? '0px 3px 4px 0px rgba(97, 102, 107, 0.25)' : '')}
        >
          {activeStreams.length > 1 && (
            <Box borderRadius="8px" bgcolor="components.bg">
              <Box display="flex" flexDirection="column" gap={4} px={4} py={3.5} pb={3}>
                <Box display="flex" alignItems="center" justifyContent="space-between" gap={3}>
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm>
                      <Typography fontSize={14} fontWeight={500}>
                        {t('You can withdraw all streams at once.')}
                      </Typography>
                    </Grid>
                    <Grid item xs={12} sm={4}>
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
                            <LoadingButton
                              fullWidth
                              variant="contained"
                              onClick={handleClaimAll}
                              loading={loading}
                              data-testid="vesting-claim-all"
                            >
                              {t('Withdraw All')}
                            </LoadingButton>
                          </>
                        )}
                      </Box>
                    </Grid>
                  </Grid>
                </Box>
              </Box>
              <Divider />
            </Box>
          )}
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
                  refetch={refetch}
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
