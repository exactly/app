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
import React, { FC, useCallback, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import waitForTransaction from 'utils/waitForTransaction';
import { LoadingButton } from '@mui/lab';
import Image from 'next/image';
import formatNumber from 'utils/formatNumber';
import { toPercentage } from 'utils/utils';
import { useWeb3 } from 'hooks/useWeb3';
import { useNetwork, useSwitchNetwork } from 'wagmi';
import { useEscrowedEXA, useEscrowedEXAReserves } from 'hooks/useEscrowedEXA';
import { useSablierV2LockupLinearWithdrawableAmountOf, useSablierV2NftDescriptorTokenUri } from 'hooks/useSablier';
import Draggable from 'react-draggable';
import CloseIcon from '@mui/icons-material/Close';
import { TransitionProps } from '@mui/material/transitions';
import { track } from 'utils/segment';

const StyledLinearProgress = styled(LinearProgress, {
  shouldForwardProp: (prop) => prop !== 'barColor',
})<{ barColor: string }>(({ theme, barColor }) => ({
  height: 6,
  borderRadius: 5,
  [`&.${linearProgressClasses.colorPrimary}`]: {
    backgroundColor: theme.palette.grey[theme.palette.mode === 'light' ? 100 : 200],
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
          <Typography variant="body2" color="secondary.main" data-testid={testId}>
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

const NFT: React.FC<{ tokenId: number; open: boolean; onClose: () => void }> = ({ tokenId, open, onClose }) => {
  const { breakpoints } = useTheme();
  const isMobile = useMediaQuery(breakpoints.down('sm'));
  const { data: nft } = useSablierV2NftDescriptorTokenUri(BigInt(tokenId));
  const { spacing } = useTheme();

  const b64 = nft?.split(',')[1] ?? '';
  const json = atob(b64) || '{}';
  const { image, name } = JSON.parse(json);
  const handleClose = useCallback(() => {
    onClose();
    track('Modal Closed', {
      name: 'nft',
      location: 'Active Stream',
    });
  }, [onClose]);

  return (
    <Dialog
      data-testid="vesting-vest-modal"
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
        data-testid="vesting-vest-modal-close"
      >
        <CloseIcon sx={{ fontSize: 19 }} />
      </IconButton>
      <Box
        display="flex"
        sx={{
          padding: { xs: spacing(2, 1, 1), sm: spacing(4, 4) },
        }}
      >
        <Image
          style={{
            borderRadius: '16px',
          }}
          src={image}
          alt={name}
          width={360}
          height={360}
        />
      </Box>
    </Dialog>
  );
};

const WithdrawAndCancel: React.FC<{
  tokenId: number;
  open: boolean;
  onClose: () => void;
  cancel: () => void;
  loading: boolean;
}> = ({ tokenId, open, onClose, cancel, loading }) => {
  const { spacing } = useTheme();
  const { chain } = useNetwork();
  const { impersonateActive, chain: displayNetwork } = useWeb3();
  const { switchNetwork, isLoading: switchIsLoading } = useSwitchNetwork();
  const { t } = useTranslation();

  const { breakpoints } = useTheme();
  const isMobile = useMediaQuery(breakpoints.down('sm'));

  const handleClose = useCallback(() => {
    onClose();
    track('Modal Closed', {
      name: 'withdraw and cancel',
      location: 'Active Stream',
    });
  }, [onClose]);

  return (
    <Dialog
      data-testid="vesting-vest-modal"
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
        data-testid="vesting-vest-modal-close"
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
              'When you withdraw the reserved EXA, the associated vesting stream will be cancelled automatically. You’ll be able to claim the earned EXA and will get back all remaining esEXA.',
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
              <LoadingButton
                fullWidth
                variant="contained"
                color="error"
                onClick={cancel}
                loading={loading}
                data-testid={`vesting-stream-${tokenId}-cancel-submit`}
              >
                {t('Withdraw and Cancel Stream')}
              </LoadingButton>
            )}
          </Box>
        </DialogContent>
      </Box>
    </Dialog>
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
  const { switchNetwork, isLoading: switchIsLoading } = useSwitchNetwork();
  const { data: reserve, isLoading: reserveIsLoading } = useEscrowedEXAReserves(BigInt(tokenId));
  const { data: withdrawable, isLoading: withdrawableIsLoading } = useSablierV2LockupLinearWithdrawableAmountOf(
    BigInt(tokenId),
  );
  const escrowedEXA = useEscrowedEXA();
  const [loading, setLoading] = useState(false);
  const [NFTModalOpen, setNFTModalOpen] = useState(false);
  const [CancelModalOpen, setCancelModalOpen] = useState(false);
  const { breakpoints } = useTheme();
  const isMobile = useMediaQuery(breakpoints.down('sm'));

  const closeNFTModal = useCallback(() => {
    setNFTModalOpen(false);
  }, []);

  const closeCancelModal = useCallback(() => {
    setCancelModalOpen(false);
  }, []);

  const cancel = useCallback(async () => {
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

  const handleWithdrawClick = useCallback(async () => {
    track('Button Clicked', {
      name: 'withdraw',
      location: 'Active Stream',
      value: progress,
    });

    if (!escrowedEXA || !opts) return;
    setLoading(true);
    try {
      const tx = await escrowedEXA.write.withdrawMax([[BigInt(tokenId)]], opts);
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
  }, [escrowedEXA, opts, progress, refetch, tokenId]);

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
          <Box display="flex" alignItems="center" gap={0.5}>
            <Box display="flex" gap={0.5}>
              <Image
                src={`/img/assets/esEXA.svg`}
                alt="EXA"
                width={20}
                height={20}
                style={{ maxWidth: '100%', height: 'auto' }}
              />
              <Typography fontSize={18} fontWeight={500} data-testid={`vesting-stream-${tokenId}-vested`}>
                {formatNumber(Number(depositAmount) / 1e18)}
              </Typography>
            </Box>
            <Box
              display="flex"
              bgcolor={({ palette: { mode } }) => (mode === 'light' ? '#EEEEEE' : '#2A2A2A')}
              px={0.5}
              borderRadius="2px"
              alignItems="center"
              onClick={() => {
                setNFTModalOpen(true);
              }}
              sx={{ cursor: 'pointer' }}
            >
              <Typography fontFamily="IBM Plex Mono" fontSize={12} fontWeight={500} textTransform="uppercase">
                {t('View NFT')}
              </Typography>
            </Box>
          </Box>
        </Grid>
        {!isMobile && <Divider orientation="vertical" sx={{ borderColor: 'grey.200', my: 0.6 }} flexItem />}
        <Grid item xs={12} sm={2.5} display="flex" flexDirection="column" justifyContent="center" gap={0.5}>
          <Typography fontSize={14} fontWeight={700}>
            {t('Reserved EXA')}
          </Typography>
          <Box display="flex" alignItems="center" gap={0.5}>
            <Box display="flex" gap={0.5}>
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
                <Typography fontSize={18} fontWeight={500} data-testid={`vesting-stream-${tokenId}-reserved`}>
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
                data-testid={
                  progress === 100 ? `vesting-stream-${tokenId}-withdraw` : `vesting-stream-${tokenId}-cancel`
                }
                onClick={() => (progress === 100 ? handleWithdrawClick() : setCancelModalOpen(true))}
                sx={{ cursor: 'pointer' }}
              >
                <Typography fontFamily="IBM Plex Mono" fontSize={12} fontWeight={500} textTransform="uppercase">
                  {progress === 100 ? t('Withdraw') : t('Cancel')}
                </Typography>
              </Box>
            )}
          </Box>
          <NFT tokenId={tokenId} open={NFTModalOpen} onClose={closeNFTModal} />
          <WithdrawAndCancel
            tokenId={tokenId}
            open={CancelModalOpen}
            onClose={closeCancelModal}
            cancel={cancel}
            loading={loading}
          />
        </Grid>
        {!isMobile && <Divider orientation="vertical" sx={{ borderColor: 'grey.200', my: 0.6 }} flexItem />}
        <Grid item xs sm display="flex" flexDirection="column" justifyContent="center" gap={0.5}>
          <Box display="flex" flexDirection="column" gap={0.5} justifyContent="space-between">
            <Typography fontSize={14} fontWeight={700}>
              {t('Claimable EXA')}
            </Typography>
            <Box display="flex" alignItems="center" gap={0.5}>
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
                <Typography fontSize={18} fontWeight={500} data-testid={`vesting-stream-${tokenId}-withdrawable`}>
                  {formatNumber(Number(withdrawable) / 1e18)}
                </Typography>
              )}
              <Typography fontSize={14} color="grey.400" data-testid={`vesting-stream-${tokenId}-left`}>
                / {formatNumber(Number(depositAmount - withdrawnAmount) / 1e18)}
              </Typography>
            </Box>
          </Box>
        </Grid>
        <Box display="flex" alignItems="center">
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
                onClick={handleWithdrawClick}
                loading={loading}
                data-testid={`vesting-stream-${tokenId}-claim`}
              >
                {t('Withdraw EXA')}
              </LoadingButton>
            </>
          )}
        </Box>
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
