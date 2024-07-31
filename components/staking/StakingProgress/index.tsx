import React, { useCallback, useMemo, useRef, useState } from 'react';
import {
  Avatar,
  AvatarGroup,
  Box,
  Dialog,
  DialogContent,
  IconButton,
  Paper,
  PaperProps,
  Slide,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import { useTranslation } from 'react-i18next';
import formatNumber from 'utils/formatNumber';
import { useStakeEXA } from 'contexts/StakeEXAContext';
import { formatEther, parseEther } from 'viem';
import { Transaction } from 'types/Transaction';
import { toPercentage } from 'utils/utils';
import parseTimestamp from 'utils/parseTimestamp';
import WAD from '@exactly/lib/esm/fixed-point-math/WAD';
import waitForTransaction from 'utils/waitForTransaction';
import { useStakedEXA } from 'hooks/useStakedEXA';
import { useWeb3 } from 'hooks/useWeb3';
import { gasLimit } from 'utils/gas';
import Draggable from 'react-draggable';
import { TransitionProps } from 'react-transition-group/Transition';
import CloseIcon from '@mui/icons-material/Close';
import LoadingTransaction from 'components/common/modal/Loading';
import { LoadingButton } from '@mui/lab';

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

function StakingOperations() {
  const { t } = useTranslation();
  const stakedEXA = useStakedEXA();
  const { opts } = useWeb3();
  const [tx, setTx] = useState<Transaction>();
  const [isLoading, setIsLoading] = useState(false);

  const {
    refetch,
    start,
    rewardsTokens,
    totalClaimable,
    totalClaimed,
    totalEarned,
    penalty,
    parameters: { refTime },
  } = useStakeEXA();

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

  const progress = useMemo(() => {
    const now = Math.floor(Date.now() / 1000);
    const avgStart = start === 0n ? parseEther(now.toString()) : start;
    const startTime = Number(avgStart / WAD);
    const endTime = Number(avgStart / WAD + refTime);
    const elapsedTime = now - startTime;
    const percentage = elapsedTime / (endTime - startTime);

    return Math.min(percentage, 100);
  }, [refTime, start]);

  const onClose = useCallback(() => {
    setTx(undefined);
  }, []);

  return (
    <Box display="flex" flexDirection={{ xs: 'column', md: 'row' }} gap={2}>
      <Box
        p={4}
        gap={8}
        flex="0 1 33%"
        borderRadius="16px"
        bgcolor="components.bg"
        boxShadow={({ palette }) => (palette.mode === 'light' ? '0px 6px 10px 0px rgba(97, 102, 107, 0.20)' : '')}
        display="flex"
        flexDirection="column"
        justifyContent="space-between"
        position="relative"
        overflow="hidden"
      >
        <Box
          position="absolute"
          top={0}
          left={0}
          height="100%"
          width={toPercentage(progress)}
          bgcolor="figma.grey.100"
          zIndex={1}
        />
        <Box display="flex" flexDirection="column" position="relative" zIndex={2} gap={2}>
          <Typography fontSize={19} fontWeight={700}>
            {t('Staking progress')}
          </Typography>
          <Typography fontSize={32} fontWeight={500}>
            {toPercentage(progress)}
          </Typography>
          {progress > 0 && (
            <Typography color={'grey.400'} fontWeight={500} fontSize={16}>
              {t('Started on')} {parseTimestamp(formatEther(start))}
            </Typography>
          )}
        </Box>
      </Box>

      <Box
        p={4}
        gap={7}
        flex="0 1 33%"
        borderRadius="16px"
        bgcolor="components.bg"
        boxShadow={({ palette }) => (palette.mode === 'light' ? '0px 6px 10px 0px rgba(97, 102, 107, 0.20)' : '')}
        display="flex"
        flexDirection="column"
        justifyContent="space-between"
      >
        <Box display="flex" flexDirection="column" gap={2}>
          <Typography fontSize={19} fontWeight={700}>
            {t('Rewards to date')}
          </Typography>
          <Box display="flex" gap={1}>
            <Typography fontSize={32}>${formatNumber(formatEther(totalClaimable), 'USD')}</Typography>
            <AvatarGroup
              max={6}
              sx={{ '& .MuiAvatar-root': { width: 32, height: 32, borderColor: 'transparent' }, alignItems: 'center' }}
            >
              {rewardsTokens.map((symbol) => (
                <Avatar key={symbol} alt={symbol} src={`/img/assets/${symbol}.svg`} />
              ))}
            </AvatarGroup>
          </Box>
          <Box display="flex" gap={1} alignItems="center">
            <Typography color={'grey.400'} fontWeight={500} fontSize={16}>
              {t('Claimed: ')}
            </Typography>
            <Typography color={'grey.400'} fontWeight={500} fontSize={16}>
              ${formatNumber(formatEther(totalClaimed), 'USD')}
            </Typography>
          </Box>

          {totalEarned > 0n && (
            <Box display="flex" gap={1} alignItems="center">
              <Typography color={'grey.400'} fontWeight={500} fontSize={16} style={{ textDecoration: 'line-through' }}>
                ${formatNumber(formatEther(totalEarned), 'USD')}
              </Typography>
              <Typography
                color={'white'}
                fontWeight={700}
                bgcolor={'#D92626'}
                fontSize={12}
                style={{ textTransform: 'uppercase', borderRadius: '4px', padding: '3px' }}
              >
                {toPercentage(Number(formatEther(penalty)), 1)} {t('penalty')}
              </Typography>
            </Box>
          )}
        </Box>
        {tx && <LoadingModal tx={tx} onClose={onClose} />}
        <Box display="flex" flexDirection="column" gap={1}>
          <LoadingButton
            variant="outlined"
            disabled={totalClaimable === 0n}
            loading={isLoading}
            onClick={() => {
              claimAll();
            }}
            fullWidth
          >
            {t('Claim rewards to date')}
          </LoadingButton>
        </Box>
      </Box>

      <Box
        p={4}
        gap={8}
        flex="0 1 33%"
        borderRadius="16px"
        bgcolor="components.bg"
        boxShadow={({ palette }) => (palette.mode === 'light' ? '0px 6px 10px 0px rgba(97, 102, 107, 0.20)' : '')}
        display="flex"
        flexDirection="column"
        justifyContent="space-between"
      >
        <Box display="flex" flexDirection="column" gap={2}>
          <Typography fontSize={19} fontWeight={700}>
            {t('Total rewards')}
          </Typography>
          <Box display="flex" gap={1}>
            <Typography fontSize={32}>${formatNumber(formatEther(totalEarned), 'USD')}</Typography>
            <AvatarGroup
              max={6}
              sx={{ '& .MuiAvatar-root': { width: 32, height: 32, borderColor: 'transparent' }, alignItems: 'center' }}
            >
              {rewardsTokens.map((symbol) => (
                <Avatar key={symbol} alt={symbol} src={`/img/assets/${symbol}.svg`} />
              ))}
            </AvatarGroup>
          </Box>
          {totalEarned > 0n && (
            <Typography color={'grey.400'} fontWeight={500} fontSize={16}>
              {t('By staking end on ')} {parseTimestamp(start / WAD + refTime)}
            </Typography>
          )}
        </Box>
      </Box>
    </Box>
  );
}
export default React.memo(StakingOperations);
