import React, { useCallback, useRef, useState } from 'react';
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
import { useStakedEXABalance } from 'hooks/useStakedEXA';
import formatNumber from 'utils/formatNumber';

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

  const isMobile = useMediaQuery(breakpoints.down('sm'));

  const handleClose = useCallback(() => {
    onClose();
    // track('Modal Closed', {
    //   name: 'Stake EXA Modal',
    //   location: 'Staking Page',
    // });
  }, [onClose]);

  return (
    <Dialog
      data-testid="staking-modal"
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
          <StakingEXAInput refetch={() => {}} operation={operation} />
        </DialogContent>
      </Box>
    </Dialog>
  );
};

function StakeEXABoard() {
  const { t } = useTranslation();
  const [stakingModal, setStakingModal] = useState(false);
  const [operation, setOperation] = useState<'deposit' | 'withdraw'>('deposit');
  const { connect, isConnected } = useWeb3();
  const { data: balance, isLoading: balanceIsLoading } = useStakedEXABalance();

  const closeStakingModal = useCallback(() => {
    setStakingModal(false);
  }, []);

  const handleClickOperation = (_operation: 'deposit' | 'withdraw') => {
    if (isConnected) {
      setOperation(_operation);
      setStakingModal(true);
    } else {
      connect();
    }
  };

  return (
    <Box display="flex" flexDirection={{ xs: 'column', md: 'row' }} gap={2}>
      <Box
        p={4}
        gap={2}
        flex="0 1 40%"
        borderRadius="16px"
        bgcolor="components.bg"
        boxShadow={({ palette }) => (palette.mode === 'light' ? '0px 6px 10px 0px rgba(97, 102, 107, 0.20)' : '')}
        display="flex"
        flexDirection="column"
        justifyContent="space-between"
      >
        <Typography fontSize={19} fontWeight={700}>
          {t('Your Staked EXA')}
        </Typography>
        <Box display="flex" flexDirection="column">
          <Box display="flex" gap={1}>
            {balanceIsLoading || !balance ? (
              <Skeleton width={80} height={60} />
            ) : (
              <Typography fontSize={38}>{formatNumber(Number(balance) / 1e18)}</Typography>
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
          {/* <Box>
            <Typography color={'grey.400'} fontWeight={600} fontSize={19}>
              {'$0.00'}
            </Typography>
          </Box> */}
        </Box>
        <Box display="flex" flexDirection="column" gap={1}>
          <Button
            variant="contained"
            onClick={() => {
              handleClickOperation('deposit');
            }}
            fullWidth
          >
            {t('Stake EXA')}
          </Button>
          <Button
            disabled
            variant="outlined"
            onClick={() => {
              handleClickOperation('withdraw');
            }}
            fullWidth
          >
            {t('Early Withdraw')}
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
      <Box
        p={2}
        flex={1}
        borderRadius="24px"
        bgcolor="components.bg"
        boxShadow={({ palette }) => (palette.mode === 'light' ? '0px 6px 10px 0px rgba(97, 102, 107, 0.20)' : '')}
        display="flex"
      >
        <Box
          bgcolor={'grey.100'}
          flex={1}
          borderRadius="16px"
          display="flex"
          flexDirection="column"
          alignItems="center"
          justifyContent="center"
          textAlign="center"
          padding={9}
        >
          <Typography fontSize={14}>
            {t('You don’t have any staked EXA yet. Here you’ll see information about your staked assets.')}
          </Typography>
          <Button fullWidth sx={{ mt: 2 }}>
            {t('Start staking now')}
          </Button>
        </Box>
      </Box>
    </Box>
  );
}
export default React.memo(StakeEXABoard);
