import React, { useCallback, useMemo, useRef, useState } from 'react';
import {
  Box,
  Button,
  Dialog,
  DialogContent,
  DialogTitle,
  Grid,
  IconButton,
  Paper,
  PaperProps,
  Skeleton,
  Slide,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material';

import { useTranslation } from 'react-i18next';
import Image from 'next/image';
import Draggable from 'react-draggable';
import { TransitionProps } from 'react-transition-group/Transition';
import CloseIcon from '@mui/icons-material/Close';
import StakingEXAInput from '../StakingEXAInput';
import { useWeb3 } from 'hooks/useWeb3';
import formatNumber from 'utils/formatNumber';
import { useEXAPrice } from 'hooks/useEXA';
import WAD from '@exactly/lib/esm/fixed-point-math/WAD';
import { formatEther, parseEther } from 'viem';
import { Transaction } from 'types/Transaction';
import { useStakeEXA } from 'contexts/StakeEXAContext';
import { toPercentage } from 'utils/utils';
import parseTimestamp from 'utils/parseTimestamp';
import { LoadingButton } from '@mui/lab';
import { useStakedEXA } from 'hooks/useStakedEXA';
import { gasLimit } from 'utils/gas';
import waitForTransaction from 'utils/waitForTransaction';
import LoadingTransaction from 'components/common/modal/Loading';

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

const StakeEXAModal: React.FC<{
  operation: 'deposit' | 'withdraw';
  tokenId: number;
  open: boolean;
  onClose: () => void;
  cancel: () => void;
  loading: boolean;
}> = ({ operation, open, onClose }) => {
  const { spacing, breakpoints } = useTheme();
  const { t } = useTranslation();
  const { refetch } = useStakeEXA();

  const isMobile = useMediaQuery(breakpoints.down('sm'));

  return (
    <Dialog
      data-testid="staking-modal"
      open={open}
      PaperComponent={PaperComponent}
      PaperProps={{
        sx: {
          borderRadius: 2,
          minWidth: '375px',
        },
      }}
      TransitionComponent={isMobile ? Transition : undefined}
      fullScreen={isMobile}
      sx={isMobile ? { top: 'auto' } : { backdropFilter: '' }}
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
        data-testid="staking-modal-close"
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
            padding: { xs: spacing(1, 0, 0), sm: spacing(1, 2, 0, 2) },
          }}
        >
          <Typography fontWeight={700} fontSize={24}>
            {operation === 'deposit' ? t('Stake amount') : t('Withdraw amount')}
          </Typography>
        </Box>
      </DialogTitle>
      <Box
        sx={{
          padding: { xs: spacing(0, 1, 2), sm: spacing(0, 4, 4) },
        }}
      >
        <DialogContent sx={{ p: 1, overflow: 'hidden' }}>
          <StakingEXAInput refetch={() => refetch()} operation={operation} />
        </DialogContent>
      </Box>
    </Dialog>
  );
};

function StakingProgress() {
  const { t } = useTranslation();
  const [stakingModal, setStakingModal] = useState(false);
  const [operation, setOperation] = useState<'deposit' | 'withdraw'>('deposit');
  const stakedEXA = useStakedEXA();
  const { connect, isConnected, impersonateActive, opts } = useWeb3();

  const { start: stakingStart, balance, totalClaimable, parameters, refetch } = useStakeEXA();
  const [tx, setTx] = useState<Transaction>();
  const [isLoading, setIsLoading] = useState(false);

  const EXAPrice = useEXAPrice();

  const EXAUsdValue = useMemo(() => {
    if (!balance || !EXAPrice) return;

    const usd = (balance * EXAPrice) / WAD;
    return formatEther(usd);
  }, [EXAPrice, balance]);

  const closeStakingModal = useCallback(() => {
    setStakingModal(false);
  }, []);

  const handleClickOperation = (_operation: 'deposit' | 'withdraw') => {
    if (isConnected || impersonateActive) {
      setOperation(_operation);
      setStakingModal(true);
    } else {
      connect();
    }
  };

  const stakedProgress = useMemo(() => {
    if (!stakingStart || !parameters) return 0;
    const now = Math.floor(Date.now() / 1000);
    const avgStart = stakingStart === 0n ? parseEther(now.toString()) : stakingStart;
    const startTime = Number(avgStart / WAD);
    const endTime = Number(avgStart / WAD + parameters.refTime);
    const elapsedTime = now - startTime;
    const percentage = elapsedTime / (endTime - startTime);

    return Math.min(percentage, 100);
  }, [parameters, stakingStart]);

  const onClose = useCallback(() => {
    setTx(undefined);
  }, []);

  const claimAll = useCallback(async () => {
    if (!stakedEXA || !opts) return;

    setIsLoading(true);
    let hash;
    try {
      const gas = await stakedEXA.estimateGas.claimAll(opts);
      hash = await stakedEXA.write.claimAll({ ...opts, gasLimit: gasLimit(gas) });

      setTx({ status: 'processing', hash });

      const { status, transactionHash } = await waitForTransaction({ hash });

      setTx({ status: status === 'success' ? 'success' : 'error', hash: transactionHash });
    } catch (e) {
      if (hash) setTx({ status: 'error', hash });
    } finally {
      refetch();
      setIsLoading(false);
    }
  }, [stakedEXA, opts, refetch]);

  return (
    <Box display="flex" flexDirection="column" gap={2}>
      <Box display="flex" flexDirection={{ xs: 'column', md: 'row' }} gap={2}>
        <Box
          p={4}
          gap={8}
          flex="0 1 50%"
          borderRadius="16px"
          bgcolor="components.bg"
          boxShadow={({ palette }) => (palette.mode === 'light' ? '0px 6px 10px 0px rgba(97, 102, 107, 0.20)' : '')}
          display="flex"
          flexDirection="column"
          justifyContent="space-between"
        >
          <Box display="flex" flexDirection="column">
            <Typography fontSize={19} fontWeight={700}>
              {t('Stake Amount')}
            </Typography>
            <Box display="flex" gap={1}>
              <StakingEXAInput refetch={() => refetch()} operation={'deposit'} />
            </Box>
          </Box>
        </Box>
        <Box
          p={4}
          flex="0 1 50%"
          borderRadius="16px"
          bgcolor="components.bg"
          boxShadow={({ palette }) => (palette.mode === 'light' ? '0px 6px 10px 0px rgba(97, 102, 107, 0.20)' : '')}
          display="flex"
          flexDirection="column"
          justifyContent="space-between"
        >
          <Box display="flex" flexDirection="column">
            <Typography fontSize={19} fontWeight={700}>
              {t('Your Staked EXA')}
            </Typography>
            <Box display="flex" gap={1}>
              {isConnected || impersonateActive ? (
                balance === undefined ? (
                  <Skeleton width={80} height={60} />
                ) : (
                  <Typography fontSize={38}>{formatNumber(Number(balance) / 1e18)}</Typography>
                )
              ) : (
                <Typography fontSize={38}>{'0'}</Typography>
              )}
              <Image
                src={`/img/assets/EXA.svg`}
                alt={'EXA'}
                width={40}
                height={40}
                style={{
                  maxWidth: '100%',
                  height: 'auto',
                }}
              />
            </Box>
            <Typography color={'grey.400'} fontWeight={600} fontSize={19}>
              ${formatNumber(EXAUsdValue || '0', 'USD')}
            </Typography>
          </Box>
          {stakedProgress > 0 && (
            <Box>
              <Grid container>
                <Grid item xs={6}>
                  <Typography fontSize={16}>{t('Progress')}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography align="right" fontSize={19} fontWeight={700} color={stakedProgress > 1 ? 'error' : ''}>
                    {toPercentage(stakedProgress)}
                  </Typography>
                </Grid>

                <Grid item xs={6}>
                  <Typography fontSize={16}>{t('Started')}</Typography>
                </Grid>
                <Grid item xs={6}>
                  {stakingStart === undefined ? (
                    <Box display="flex" justifyContent="flex-end">
                      <Skeleton width={90} height={20} />
                    </Box>
                  ) : (
                    <Typography align="right" fontSize={19} fontWeight={700}>
                      {parseTimestamp(formatEther(stakingStart))}
                    </Typography>
                  )}
                </Grid>

                <Grid item xs={6}>
                  <Typography fontSize={16}>{t('Ends')}</Typography>
                </Grid>
                <Grid item xs={6}>
                  {stakingStart === undefined || parameters === undefined ? (
                    <Box display="flex" justifyContent="flex-end">
                      <Skeleton width={90} height={20} />
                    </Box>
                  ) : (
                    <Typography align="right" fontSize={19} fontWeight={700}>
                      {parseTimestamp(stakingStart / WAD + parameters.refTime)}
                    </Typography>
                  )}
                </Grid>
              </Grid>
            </Box>
          )}
        </Box>
      </Box>
      <Box display="flex" justifyContent="center" alignItems="center" gap={2} width="100%" margin="0 auto">
        <Box display="flex" flexGrow={1} maxWidth="47%">
          <LoadingButton
            variant="outlined"
            disabled={totalClaimable === 0n}
            loading={isLoading}
            onClick={() => {
              claimAll();
            }}
            style={{ flexGrow: 1 }}
          >
            {t('Claim rewards to date')}
          </LoadingButton>
        </Box>
        {tx && <LoadingModal tx={tx} onClose={onClose} />}
        <Box display="flex" flexGrow={1} maxWidth="47%">
          <Button
            variant="outlined"
            disabled={!isConnected && !impersonateActive}
            onClick={() => {
              handleClickOperation('withdraw');
            }}
            style={{ flexGrow: 1 }}
          >
            {stakedProgress && stakedProgress < 1 ? t('Early Withdraw') : t('Withdraw')}
          </Button>
          <StakeEXAModal
            operation={operation}
            tokenId={1}
            open={stakingModal}
            onClose={closeStakingModal}
            cancel={closeStakingModal}
            loading={false}
          />
        </Box>
      </Box>
    </Box>
  );
}
export default React.memo(StakingProgress);

function LoadingModal({ tx, onClose }: { tx: Transaction; onClose: () => void }) {
  const { t } = useTranslation();
  const { breakpoints, spacing, palette } = useTheme();
  const isMobile = useMediaQuery(breakpoints.down('sm'));
  const loadingTx = useMemo(() => tx && (tx.status === 'loading' || tx.status === 'processing'), [tx]);

  const handleClose = useCallback(() => {
    if (loadingTx) return;
    onClose();
  }, [loadingTx, onClose]);

  return (
    <Dialog
      data-testid="staking-modal"
      open={!!tx}
      onClose={handleClose}
      PaperComponent={isMobile ? undefined : PaperComponent}
      PaperProps={{
        sx: {
          borderRadius: 1,
          minWidth: '375px',
          maxWidth: '488px !important',
          width: '100%',
          overflowY: 'hidden !important',
        },
      }}
      TransitionComponent={isMobile ? Transition : undefined}
      fullScreen={isMobile}
      sx={isMobile ? { top: 'auto' } : { backdropFilter: tx ? 'blur(1.5px)' : '' }}
      disableEscapeKeyDown={loadingTx}
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
        data-testid="staking-modal-close"
      >
        <CloseIcon sx={{ fontSize: 19 }} />
      </IconButton>
      <Box
        sx={{
          padding: { xs: spacing(3, 2, 2), sm: spacing(5, 4, 4) },
          borderTop: tx ? '' : `4px ${palette.mode === 'light' ? 'black' : 'white'} solid`,
          overflowY: 'auto',
        }}
      >
        <DialogContent sx={{ p: 0, overflow: 'hidden' }}>
          <LoadingTransaction
            tx={tx}
            messages={{
              pending: t('pending'),
              success: t('success'),
              error: t('error'),
            }}
          />
        </DialogContent>
      </Box>
    </Dialog>
  );
}
