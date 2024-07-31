import React, { useCallback, useMemo, useRef, useState } from 'react';
import {
  Box,
  Button,
  Dialog,
  DialogContent,
  DialogTitle,
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
import { formatEther } from 'viem';
import { useStakeEXA } from 'contexts/StakeEXAContext';

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
  const { connect, isConnected, impersonateActive } = useWeb3();

  const {
    start: stakingStart,
    balance,
    parameters: { refTime },
    refetch,
  } = useStakeEXA();

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
    if (!stakingStart || !refTime) return;

    const now = Math.floor(Date.now() / 1000);
    const start = Math.floor(Number(stakingStart) / 1e18);
    const end = start + Number(refTime);
    const progress = (now - start) / (end - start);

    return Math.min(Math.max(progress, 0), 1);
  }, [stakingStart, refTime]);

  return (
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
        <Box display="flex" flexDirection="column" gap={1}>
          <Button
            variant="outlined"
            disabled={!isConnected && !impersonateActive}
            onClick={() => {
              handleClickOperation('withdraw');
            }}
            fullWidth
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
