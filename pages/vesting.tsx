import React, { useCallback, useMemo, useRef, useState } from 'react';
import type { NextPage } from 'next';

import { Trans, useTranslation } from 'react-i18next';
import {
  Box,
  Button,
  Dialog,
  DialogContent,
  DialogTitle,
  Divider,
  Grid,
  IconButton,
  List,
  Paper,
  PaperProps,
  Skeleton,
  Slide,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import { LoadingButton } from '@mui/lab';
import { useNetwork, useSwitchNetwork } from 'wagmi';
import { useModal } from 'contexts/ModalContext';
import VestingInput from 'components/VestingInput';
import ActiveStream from 'components/ActiveStream';
import { useUpdateStreams, useEscrowedEXA, useEscrowedEXAReserveRatio, useEscrowEXATotals } from 'hooks/useEscrowedEXA';
import { useWeb3 } from 'hooks/useWeb3';
import useRewards from 'hooks/useRewards';
import waitForTransaction from 'utils/waitForTransaction';
import formatNumber from 'utils/formatNumber';
import { toPercentage } from 'utils/utils';
import { track } from 'utils/mixpanel';
import { formatEther } from 'viem';
import { TransitionGroup } from 'react-transition-group';
import Collapse from '@mui/material/Collapse';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import CloseIcon from '@mui/icons-material/Close';
import Image from 'next/image';
import Draggable from 'react-draggable';
import { TransitionProps } from '@mui/material/transitions';
import WAD from '@exactly/lib/esm/fixed-point-math/WAD';

function PaperComponent(props: PaperProps | undefined) {
  const ref = useRef<HTMLDivElement>(null);
  return (
    <Draggable nodeRef={ref} cancel={'[class*="MuiDialogContent-root"]'}>
      <Paper {...props} ref={ref} />
    </Draggable>
  );
}

const Transition = React.forwardRef(function Transition(
  props: TransitionProps & {
    children: React.ReactElement;
  },
  ref: React.Ref<unknown>,
) {
  return <Slide direction="up" ref={ref} {...props} />;
});

const WithdrawAndCancel: React.FC<{
  open: boolean;
  onClose: () => void;
  cancel: () => void;
  l: boolean;
}> = ({ open, onClose, cancel, l }) => {
  const { spacing } = useTheme();
  const { breakpoints } = useTheme();
  const { t } = useTranslation();
  const { impersonateActive, chain: displayNetwork } = useWeb3();
  const isMobile = useMediaQuery(breakpoints.down('sm'));
  const { chain } = useNetwork();
  const { switchNetwork, isLoading: switchIsLoading } = useSwitchNetwork();

  const handleClose = useCallback(() => {
    onClose();
    track('Modal Closed', {
      name: 'withdraw and cancel',
      location: 'Active Stream',
    });
  }, [onClose]);

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      PaperComponent={PaperComponent}
      PaperProps={{
        sx: {
          borderRadius: 2,
          minWidth: '375px',
        },
      }}
      TransitionComponent={isMobile ? Transition : undefined}
      fullScreen={isMobile}
      sx={isMobile ? { top: 'auto' } : { backdropFilter: 'blur(1.5px)' }}
    >
      <IconButton
        aria-label="close"
        onClick={onClose}
        sx={{
          position: 'absolute',
          right: 4,
          top: 8,
          color: 'grey.500',
        }}
      >
        <CloseIcon sx={{ fontSize: 19 }} />
      </IconButton>

      <DialogTitle
        sx={{
          cursor: { xs: '', sm: 'move' },
        }}
      >
        <Box
          sx={{
            padding: { xs: spacing(2, 1, 1), sm: spacing(1, 2, 0, 2) },
          }}
        >
          <Typography fontWeight={700} fontSize={24}>
            {t('Withdraw Reserved EXA')}
          </Typography>
        </Box>
      </DialogTitle>
      <Box
        sx={{
          padding: { xs: spacing(2, 1, 1), sm: spacing(2, 4, 4) },
        }}
      >
        <DialogContent sx={{ p: 1, overflow: 'hidden' }}>
          <Typography fontSize={14} fontWeight={500}>
            {t(
              'When you withdraw the reserved EXA, the associated vestings streams will be cancelled automatically. You’ll get back the earned EXA and all remaining esEXA',
            )}
          </Typography>
          <Box display="flex" gap={2} mt={4} alignItems="center">
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
              <LoadingButton fullWidth variant="contained" color="error" onClick={cancel} loading={l}>
                {t('Withdraw and Cancel Stream')}
              </LoadingButton>
            )}
          </Box>
        </DialogContent>
      </Box>
    </Dialog>
  );
};

const Vesting: NextPage = () => {
  const { t } = useTranslation();
  const { impersonateActive, chain: displayNetwork, opts } = useWeb3();
  const { chain } = useNetwork();
  const { activeStreams, loading: streamsLoading, refetch } = useUpdateStreams();
  const { switchNetwork, isLoading: switchIsLoading } = useSwitchNetwork();
  const { data: reserveRatio } = useEscrowedEXAReserveRatio();
  const { totalReserve, reserveIsLoading, totalWithdrawable, withdrawableIsLoading } = useEscrowEXATotals(
    activeStreams.map(({ tokenId }) => Number(tokenId)),
  );

  const [loading, setLoading] = useState<boolean>(false);
  const [showAll, setShowAll] = useState<boolean>(false);
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const escrowedEXA = useEscrowedEXA();
  const { breakpoints } = useTheme();
  const isMobile = useMediaQuery(breakpoints.down('sm'));

  const { rewards } = useRewards();
  const { open: openRewards } = useModal('rewards');
  const { open: openGetEXA } = useModal('get-exa');

  const { usdPrice, unclaimedTokens } = {
    usdPrice: rewards['esEXA']?.usdPrice || 0n,
    unclaimedTokens: rewards['esEXA']?.amount || 0n,
  };

  const totalsStreamData = useMemo(() => {
    if (!activeStreams) return { totalVestedEsEXA: 0n, totalWithdrawnEXA: 0n };

    return activeStreams.reduce(
      (acc, { depositAmount, withdrawnAmount }) => {
        return {
          totalVestedEsEXA: acc.totalVestedEsEXA + BigInt(depositAmount),
          totalWithdrawnEXA: acc.totalWithdrawnEXA + BigInt(withdrawnAmount),
        };
      },
      { totalVestedEsEXA: 0n, totalWithdrawnEXA: 0n },
    );
  }, [activeStreams]);

  const allCancelabelStreamsIds = useMemo(() => {
    if (!activeStreams) return [];

    const now = Math.floor(Date.now() / 1000);
    return activeStreams.filter(({ endTime }) => Number(endTime) > now).map(({ tokenId }) => BigInt(tokenId));
  }, [activeStreams]);

  const handleClaimAll = useCallback(async () => {
    track('Button Clicked', {
      location: 'Vesting',
      name: 'claim all',
      value: activeStreams.length,
    });
    if (!activeStreams || !escrowedEXA || !opts) return;
    setLoading(true);
    try {
      const tx = await escrowedEXA.write.withdrawMax([activeStreams.map(({ tokenId }) => BigInt(tokenId))], opts);
      track('TX Signed', {
        contractName: 'EscrowedEXA',
        method: 'withdrawMax',
        hash: tx,
      });
      const { status } = await waitForTransaction({ hash: tx });
      track('TX Completed', {
        contractName: 'EscrowedEXA',
        method: 'withdrawMax',
        hash: tx,
        status,
      });
    } catch {
      // if request fails, don't do anything
    } finally {
      setLoading(false);
      refetch();
    }
  }, [activeStreams, escrowedEXA, opts, refetch]);

  const { totalVestedEsEXA, totalWithdrawnEXA } = totalsStreamData;

  const toggleShowAll = () => {
    setShowAll(!showAll);
  };

  const closeCancelModal = useCallback(() => {
    setCancelModalOpen(false);
  }, []);

  const withdrawAll = useCallback(() => {
    if (allCancelabelStreamsIds.length === 0 && activeStreams.length > 0) {
      track('Button Clicked', {
        location: 'Vesting',
        name: 'claim all',
        value: activeStreams.length,
      });
      handleClaimAll();
    }
    if (allCancelabelStreamsIds.length > 0) {
      track('Button Clicked', {
        location: 'Vesting',
        name: 'withdraw all',
        value: allCancelabelStreamsIds.length,
      });
      setCancelModalOpen(true);
    }
  }, [activeStreams.length, allCancelabelStreamsIds.length, handleClaimAll]);

  const cancelAll = useCallback(async () => {
    if (!escrowedEXA || !opts) return;
    setLoading(true);
    try {
      const tx = await escrowedEXA.write.cancel([allCancelabelStreamsIds], opts);
      await waitForTransaction({ hash: tx });
    } catch (e) {
      // if request fails, don't do anything
    } finally {
      setLoading(false);
      refetch();
    }
  }, [allCancelabelStreamsIds, escrowedEXA, opts, refetch]);

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
              onClick={() =>
                track('Button Clicked', {
                  location: 'Vesting',
                  name: 'learn more ',
                  href: 'https://docs.exact.ly/governance/exactly-token-exa/escrowedexa-esexa',
                })
              }
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
                      onClick={() => {
                        openGetEXA();
                        track('Button Clicked', {
                          location: 'Vesting',
                          name: 'get EXA',
                        });
                      }}
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

      {activeStreams.length > 0 && (
        <Box
          borderRadius="8px"
          bgcolor="components.bg"
          boxShadow={({ palette }) => (palette.mode === 'light' ? '0px 3px 4px 0px rgba(97, 102, 107, 0.25)' : '')}
        >
          <Box display="flex" flexDirection="column" gap={4} px={4} py={3.5} pb={3}>
            <Box display="flex" alignItems="center" justifyContent="space-between" gap={3}>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={4} display="flex" flexDirection="column" alignItems="center" gap={0.5}>
                  <Typography fontSize={14} fontWeight={700}>
                    {t('Total esEXA Vesting')}
                  </Typography>
                  <Box display="flex" flexDirection={isMobile ? 'row' : 'column'} alignItems="center" gap={2.5}>
                    <Box display="flex" gap={0.5}>
                      <Image
                        src={`/img/assets/esEXA.svg`}
                        alt="esEXA"
                        width={20}
                        height={20}
                        style={{ maxWidth: '100%', height: 'auto' }}
                      />
                      <Box display="flex" flexDirection="column">
                        <Box display="flex" gap={0.5}>
                          <Typography fontSize={19} fontWeight={500}>
                            {formatNumber(Number(totalVestedEsEXA) / 1e18)}
                          </Typography>
                        </Box>
                        <Box display="flex" gap={0.5} justifyContent="space-around">
                          <Typography fontSize={12} fontWeight={500}>
                            ${formatNumber(formatEther((usdPrice * totalVestedEsEXA) / WAD), 'USD')}
                          </Typography>
                        </Box>
                      </Box>
                    </Box>
                    <Box display="flex">
                      <Typography fontSize={14} fontWeight={700}>
                        {activeStreams.length} {activeStreams.length > 1 ? t('Active Streams') : t('Active Stream')}
                      </Typography>
                    </Box>
                  </Box>
                </Grid>
                {!isMobile && <Divider orientation="vertical" sx={{ borderColor: 'grey.200' }} flexItem />}
                <Grid
                  item
                  xs={12}
                  sm={3.9}
                  display="flex"
                  flexDirection="column"
                  alignItems="center"
                  justifyContent="center"
                  gap={0.5}
                >
                  <Typography fontSize={14} fontWeight={700}>
                    {t('Total Reserved EXA')}
                  </Typography>
                  <Box display="flex" flexDirection={isMobile ? 'row' : 'column'} alignItems="center" gap={2.5}>
                    <Box display="flex" gap={0.5}>
                      <Image
                        src={`/img/assets/EXA.svg`}
                        alt="EXA"
                        width={20}
                        height={20}
                        style={{ maxWidth: '100%', height: 'auto' }}
                      />
                      {reserveIsLoading || totalReserve === undefined ? (
                        <Skeleton width={30} />
                      ) : (
                        <Box display="flex" flexDirection="column">
                          <Box display="flex" gap={0.5}>
                            <Typography fontSize={19} fontWeight={500}>
                              {formatNumber(Number(totalReserve) / 1e18)}
                            </Typography>
                          </Box>
                          <Box display="flex" gap={0.5} justifyContent="space-around">
                            <Typography fontSize={12} fontWeight={500}>
                              ${formatNumber(formatEther((usdPrice * totalReserve) / WAD), 'USD')}
                            </Typography>
                          </Box>
                        </Box>
                      )}
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
                          <LoadingButton fullWidth variant="outlined" onClick={withdrawAll} loading={loading}>
                            {t('Withdraw All')}
                          </LoadingButton>
                        </>
                      )}
                    </Box>
                    <WithdrawAndCancel
                      open={cancelModalOpen}
                      onClose={closeCancelModal}
                      cancel={cancelAll}
                      l={loading}
                    />
                  </Box>
                </Grid>
                {!isMobile && <Divider orientation="vertical" sx={{ borderColor: 'grey.200' }} flexItem />}
                <Grid
                  item
                  xs={12}
                  sm={4}
                  display="flex"
                  flexDirection="column"
                  alignItems="center"
                  justifyContent="center"
                  gap={0.5}
                >
                  <Typography fontSize={14} fontWeight={700}>
                    {t('Total Claimable EXA')}
                  </Typography>
                  <Box display="flex" flexDirection={isMobile ? 'row' : 'column'} alignItems="center" gap={2.5}>
                    <Box display="flex" gap={0.5}>
                      <Image
                        src={`/img/assets/EXA.svg`}
                        alt="EXA"
                        width={20}
                        height={20}
                        style={{ maxWidth: '100%', height: 'auto' }}
                      />
                      {withdrawableIsLoading || totalWithdrawable === undefined ? (
                        <Skeleton width={30} />
                      ) : (
                        <Box display="flex" flexDirection="column">
                          <Box display="flex" gap={0.5}>
                            <Typography fontSize={19} fontWeight={500}>
                              {formatNumber(Number(totalWithdrawable) / 1e18)}
                            </Typography>
                            <Typography fontSize={19} fontWeight={500} color="grey.400">
                              / {formatNumber(Number(totalVestedEsEXA - totalWithdrawnEXA) / 1e18)}
                            </Typography>
                          </Box>
                          <Box display="flex" gap={0.5} justifyContent="space-around">
                            <Typography fontSize={12} fontWeight={500}>
                              ${formatNumber(formatEther((usdPrice * totalWithdrawable) / WAD), 'USD')}
                            </Typography>
                            <Typography fontSize={12} fontWeight={500}>
                              /
                            </Typography>
                            <Typography fontSize={12} fontWeight={500} color="grey.400">
                              $
                              {formatNumber(
                                formatEther((usdPrice * (totalVestedEsEXA - totalWithdrawnEXA)) / WAD),
                                'USD',
                              )}
                            </Typography>
                          </Box>
                        </Box>
                      )}
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
                          <LoadingButton
                            fullWidth
                            variant="contained"
                            onClick={handleClaimAll}
                            loading={loading}
                            data-testid="vesting-claim-all"
                          >
                            {t('Claim All')}
                          </LoadingButton>
                        </>
                      )}
                    </Box>
                  </Box>
                </Grid>
              </Grid>
            </Box>
          </Box>
        </Box>
      )}

      {activeStreams.length > 0 && !streamsLoading && (
        <Box
          borderRadius="8px"
          bgcolor="components.bg"
          boxShadow={({ palette }) => (palette.mode === 'light' ? '0px 3px 4px 0px rgba(97, 102, 107, 0.25)' : '')}
        >
          <List sx={{ mt: 1 }}>
            <TransitionGroup>
              {activeStreams
                .slice(0, showAll ? activeStreams.length : 5)
                .map(({ id, tokenId, depositAmount, withdrawnAmount, startTime, endTime, cancelable }, index) => (
                  <Collapse key={id}>
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
                  </Collapse>
                ))}
            </TransitionGroup>
          </List>
          {activeStreams.length > 5 && (
            <Box borderRadius="8px" bgcolor="components.bg" textAlign="center">
              <Button onClick={toggleShowAll}>
                {showAll ? t('Hide') : t('Show All')}{' '}
                {showAll ? (
                  <ExpandLessIcon sx={{ fontSize: 14, my: 'auto' }} fontSize="small" />
                ) : (
                  <ExpandMoreIcon sx={{ fontSize: 14, my: 'auto' }} fontSize="small" />
                )}
              </Button>
            </Box>
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
