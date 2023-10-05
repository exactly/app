import {
  Box,
  Button,
  Dialog,
  DialogContent,
  DialogTitle,
  Divider,
  Grid,
  IconButton,
  LinearProgress,
  Paper,
  PaperProps,
  Skeleton,
  Slide,
  Typography,
  linearProgressClasses,
  styled,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import React, { FC, ReactNode, useCallback, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { waitForTransaction } from '@wagmi/core';
import { LoadingButton } from '@mui/lab';
import Image from 'next/image';
import formatNumber from 'utils/formatNumber';
import { toPercentage } from 'utils/utils';
import { useWeb3 } from 'hooks/useWeb3';
import { useNetwork, useSwitchNetwork } from 'wagmi';
import { useEscrowedEXA, useEscrowedEXAReserves } from 'hooks/useEscrowedEXA';
import { useSablierV2LockupLinearWithdrawableAmountOf } from 'hooks/useSablier';
import Draggable from 'react-draggable';
import CloseIcon from '@mui/icons-material/Close';
import { TransitionProps } from '@mui/material/transitions';

const StyledLinearProgress = styled(LinearProgress, {
  shouldForwardProp: (prop) => prop !== 'barColor',
})<{ barColor: string }>(({ theme, barColor }) => ({
  height: 6,
  borderRadius: 5,
  [`&.${linearProgressClasses.colorPrimary}`]: {
    backgroundColor: theme.palette.grey[100],
  },
  [`& .${linearProgressClasses.bar}`]: {
    borderRadius: 5,
    backgroundColor: barColor,
  },
}));

const CustomProgressBar: React.FC<{ value: number; 'data-testid'?: string }> = ({ value, 'data-testid': testId }) => {
  return (
    <Box position="relative" display="flex" alignItems="center" width="70%" gap={2}>
      <Typography variant="body2" color="textSecondary">
        0%
      </Typography>
      <Box position="relative" sx={{ flexGrow: 1 }}>
        <StyledLinearProgress variant="determinate" value={value} barColor="primary" sx={{ flexGrow: 1 }} />
        <Box
          position="absolute"
          left={`${value}%`}
          top={-7}
          sx={{
            transform: `translateX(-${value}%)`,
            bgcolor: 'primary.main',
            pl: 0.5,
            pr: 0.5,
            display: 'flex',
            alignItems: 'center',
            borderRadius: '4px',
          }}
        >
          <Typography variant="body2" color="white" data-testid={testId}>
            {toPercentage(value / 100, value === 100 ? 0 : 2)}
          </Typography>
        </Box>
      </Box>
      <Typography variant="body2" color="textSecondary">
        100%
      </Typography>
    </Box>
  );
};

type ActiveStreamProps = {
  tokenId: number;
  depositAmount: bigint;
  withdrawnAmount: bigint;
  startTime: number;
  endTime: number;
  cancellable: boolean;
  refetch: () => void;
};

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

function Modal({ open, onClose, content }: { open: boolean; onClose: () => void; content: ReactNode }) {
  const { breakpoints } = useTheme();
  const isMobile = useMediaQuery(breakpoints.down('sm'));

  return (
    <Dialog
      data-testid="vesting-vest-modal"
      open={open}
      onClose={onClose}
      PaperComponent={PaperComponent}
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
      sx={isMobile ? { top: 'auto' } : { backdropFilter: content ? 'blur(1.5px)' : '' }}
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
        data-testid="vesting-vest-modal-close"
      >
        <CloseIcon sx={{ fontSize: 19 }} />
      </IconButton>
      {content}
    </Dialog>
  );
}

const ActiveStream: FC<ActiveStreamProps> = ({
  tokenId,
  depositAmount,
  withdrawnAmount,
  startTime,
  endTime,
  cancellable,
  refetch,
}) => {
  const { t } = useTranslation();
  const { impersonateActive, chain: displayNetwork, opts } = useWeb3();
  const { chain } = useNetwork();
  const { spacing } = useTheme();
  const { switchNetwork, isLoading: switchIsLoading } = useSwitchNetwork();
  const { data: reserve, isLoading: reserveIsLoading } = useEscrowedEXAReserves(BigInt(tokenId));
  const { data: withdrawable, isLoading: withdrawableIsLoading } = useSablierV2LockupLinearWithdrawableAmountOf(
    BigInt(tokenId),
  );
  const escrowedEXA = useEscrowedEXA();
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalContent, setModalContent] = useState<ReactNode | null>(null);
  const { breakpoints } = useTheme();
  const isMobile = useMediaQuery(breakpoints.down('sm'));

  const WhitdrawAndCancel = () => {
    return (
      <>
        <DialogTitle
          sx={{
            cursor: { xs: '', sm: 'move' },
          }}
        >
          <Typography fontWeight={700} fontSize={24}>
            {t('Whitdraw Reserved EXA')}
          </Typography>
        </DialogTitle>
        <Box
          sx={{
            padding: { xs: spacing(2, 1, 1), sm: spacing(2, 3, 3) },
          }}
        >
          <DialogContent sx={{ p: 0, overflow: 'hidden' }}>
            <Box>
              {t(
                'When you withdraw the reserved EXA, the associated vesting stream will be cancelled automatically. You’ll be able to claim the earned EXA and will get back all remaining esEXA.',
              )}
            </Box>
            <Box display="flex" gap={2} alignItems="center">
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
                    color="error"
                    onClick={handleWithdraw}
                    loading={loading}
                    data-testid={`vesting-stream-${tokenId}-claim`}
                  >
                    {t('Whitdraw and Cancel Stream')}
                  </LoadingButton>
                </>
              )}
            </Box>
          </DialogContent>
        </Box>
      </>
    );
  };

  const onClose = useCallback(() => {
    setModalOpen(false);
  }, []);

  function handleContent(contentComponent: ReactNode) {
    setModalContent(contentComponent);
    setModalOpen(true);
  }

  const handleWithdraw = useCallback(async () => {
    if (!escrowedEXA || !opts) return;
    setLoading(true);
    try {
      const tx = await escrowedEXA.write.cancel([[BigInt(tokenId)]], opts);
      await waitForTransaction({ hash: tx });
    } catch (e) {
      // if request fails, don't do anything
    } finally {
      setLoading(false);
      refetch();
    }
  }, [escrowedEXA, opts, refetch, tokenId]);

  const handleClick = useCallback(async () => {
    if (!escrowedEXA || !opts) return;
    setLoading(true);
    try {
      const tx = await escrowedEXA.write.withdrawMax([[BigInt(tokenId)]], opts);
      await waitForTransaction({ hash: tx });
    } catch {
      // if request fails, don't do anything
    } finally {
      setLoading(false);
      refetch();
    }
  }, [escrowedEXA, opts, refetch, tokenId]);

  const elapsed = useMemo(() => {
    const now = Math.floor(Date.now() / 1000);
    return now - startTime;
  }, [startTime]);

  const duration = useMemo(() => {
    return endTime - startTime;
  }, [startTime, endTime]);

  const progress = useMemo(() => {
    if (elapsed >= duration) return 100;
    return (elapsed / duration) * 100;
  }, [elapsed, duration]);

  const timeLeft = useMemo(() => {
    const now = Math.floor(Date.now() / 1000);
    const secondsLeft = endTime - now;
    const daysLeft = Math.floor(secondsLeft / 86_400);

    if (daysLeft > 1) {
      return t('{{daysLeft}} days left', { daysLeft });
    }

    if (daysLeft === 1) {
      return t('{{daysLeft}} day left', { daysLeft });
    }

    if (daysLeft === 0) {
      const hoursLeft = Math.floor(secondsLeft / 60 / 60);
      return t('{{hoursLeft}} hours left', { hoursLeft });
    }

    if (daysLeft < 0) {
      return t('Completed');
    }
  }, [endTime, t]);

  return (
    <Box display="flex" flexDirection="column" px={4} py={3.5} pb={3} data-testid={`vesting-stream-${tokenId}`}>
      <Grid container gap={2} mb={1}>
        <Grid item xs={12} sm={2.5} display="flex" flexDirection="column" justifyContent="center" gap={0.5}>
          <Typography fontSize={14} fontWeight={700}>
            {t('esEXA Vested')}
          </Typography>
          <Box display="flex" alignItems="center" gap={0.5} justifyContent="space-between">
            <Box display="flex">
              <Image
                src={`/img/assets/EXA.svg`}
                alt="EXA"
                width={20}
                height={20}
                style={{ maxWidth: '100%', height: 'auto' }}
              />
              <Typography variant="h6" fontWeight={400} data-testid={`vesting-stream-${tokenId}-vested`}>
                {formatNumber(Number(depositAmount) / 1e18)}
              </Typography>
            </Box>
            <Box
              display="flex"
              bgcolor={({ palette: { mode } }) => (mode === 'light' ? '#EEEEEE' : '#2A2A2A')}
              px={0.5}
              borderRadius="2px"
              alignItems="center"
              onClick={() => handleContent(WhitdrawAndCancel())}
              sx={{ cursor: 'pointer' }}
            >
              <Typography fontFamily="IBM Plex Mono" fontSize={12} fontWeight={500} textTransform="uppercase">
                {t('View NFT')}
              </Typography>
            </Box>
          </Box>
        </Grid>
        <Divider orientation="vertical" sx={{ borderColor: 'grey.200', my: 0.6 }} flexItem />
        <Grid item xs={12} sm={2.5} display="flex" flexDirection="column" justifyContent="center" gap={0.5}>
          <Typography fontSize={14} fontWeight={700}>
            {t('Reserved EXA')}
          </Typography>
          <Box display="flex" alignItems="center" gap={0.5} justifyContent="space-between">
            <Box display="flex">
              <Image
                src={`/img/assets/EXA.svg`}
                alt="EXA"
                width={20}
                height={20}
                style={{ maxWidth: '100%', height: 'auto' }}
              />
              {reserveIsLoading ? (
                <Skeleton width={30} />
              ) : (
                <Typography variant="h6" fontWeight={400} data-testid={`vesting-stream-${tokenId}-reserved`}>
                  {formatNumber(Number(reserve ?? 0n) / 1e18)}
                </Typography>
              )}
            </Box>
            {cancellable && (
              <Box
                display="flex"
                bgcolor={({ palette: { mode } }) => (mode === 'light' ? '#EEEEEE' : '#2A2A2A')}
                px={0.5}
                borderRadius="2px"
                alignItems="center"
                onClick={() => (progress === 100 ? handleClick() : handleContent(WhitdrawAndCancel()))}
                sx={{ cursor: 'pointer' }}
              >
                <Typography fontFamily="IBM Plex Mono" fontSize={12} fontWeight={500} textTransform="uppercase">
                  {t('Whitdraw')}
                </Typography>
              </Box>
            )}
          </Box>
          {modalOpen && modalContent && <Modal open={modalOpen} onClose={onClose} content={modalContent} />}
        </Grid>
        <Divider orientation="vertical" sx={{ borderColor: 'grey.200', my: 0.6 }} flexItem />
        <Grid item xs={12} sm display="flex" flexDirection="column" justifyContent="center" gap={0.5}>
          <Typography fontSize={14} fontWeight={700}>
            {t('Claimable EXA')}
          </Typography>
          <Box display="flex" alignItems="center" gap={0.5} justifyContent="space-between">
            <Box display="flex" alignItems="center">
              <Image
                src={`/img/assets/EXA.svg`}
                alt="EXA"
                width={20}
                height={20}
                style={{ maxWidth: '100%', height: 'auto' }}
              />
              {withdrawableIsLoading ? (
                <Skeleton width={30} />
              ) : (
                <Typography variant="h6" fontWeight={400} data-testid={`vesting-stream-${tokenId}-withdrawable`}>
                  {formatNumber(Number(withdrawable) / 1e18)}
                </Typography>
              )}
              <Typography fontSize={14} color="grey.400" data-testid={`vesting-stream-${tokenId}-left`}>
                / {formatNumber(Number(depositAmount - withdrawnAmount) / 1e18)}
              </Typography>
            </Box>
            <Box display="flex">
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
                    onClick={handleClick}
                    loading={loading}
                    data-testid={`vesting-stream-${tokenId}-claim`}
                  >
                    {progress === 100 ? t('Claim & Whitdraw EXA') : t('Claim EXA')}
                  </LoadingButton>
                </>
              )}
            </Box>
          </Box>
        </Grid>
      </Grid>

      <Box display="flex" justifyContent="space-between">
        <Box display="flex" gap={1}>
          <Typography fontSize={14} fontWeight={700} noWrap>
            {t('Progress')}:
          </Typography>
          {!isMobile && (
            <Typography fontSize={14} fontWeight={400} data-testid={`vesting-stream-${tokenId}-timeleft`}>
              {timeLeft}
            </Typography>
          )}
        </Box>
        <CustomProgressBar value={progress} data-testid={`vesting-stream-${tokenId}-progress`} />
      </Box>
    </Box>
  );
};

export default React.memo(ActiveStream);
