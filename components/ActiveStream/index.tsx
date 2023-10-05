import {
  Box,
  Button,
  Divider,
  LinearProgress,
  Skeleton,
  Typography,
  linearProgressClasses,
  styled,
} from '@mui/material';
import React, { FC, useCallback, useMemo, useState } from 'react';
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
      const minutesLeft = Math.floor(secondsLeft / 60);
      return t('{{minutesLeft}} minutes left', { minutesLeft });
    }

    if (daysLeft < 0) {
      return t('Completed');
    }
  }, [endTime, t]);

  return (
    <Box display="flex" flexDirection="column" gap={4} px={4} py={3.5} pb={3} data-testid={`vesting-stream-${tokenId}`}>
      <Box display="flex" alignItems="center" justifyContent="space-between" gap={3}>
        <Box display="flex" alignItems="center" gap={3}>
          <Box display="flex" flexDirection="column" gap={0.5}>
            <Typography fontSize={14} fontWeight={700}>
              {t('esEXA Vested')}
            </Typography>
            <Box display="flex" alignItems="center" gap={0.5}>
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
              <Box
                display="flex"
                bgcolor={({ palette: { mode } }) => (mode === 'light' ? '#EEEEEE' : '#2A2A2A')}
                px={0.5}
                borderRadius="2px"
                alignItems="center"
                // onClick={onClick}
                sx={{ cursor: 'pointer' }}
              >
                <Typography fontFamily="IBM Plex Mono" fontSize={12} fontWeight={500} textTransform="uppercase">
                  {t('View NFT')}
                </Typography>
              </Box>
            </Box>
          </Box>
          <Divider orientation="vertical" sx={{ borderColor: 'grey.200', my: 0.6 }} flexItem />
          <Box display="flex" flexDirection="column" gap={0.5}>
            <Typography fontSize={14} fontWeight={700}>
              {t('Reserved EXA')}
            </Typography>
            <Box display="flex" alignItems="center" gap={0.5}>
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
              {cancellable && (
                <Box
                  display="flex"
                  bgcolor={({ palette: { mode } }) => (mode === 'light' ? '#EEEEEE' : '#2A2A2A')}
                  px={0.5}
                  borderRadius="2px"
                  alignItems="center"
                  // onClick={onClick}
                  sx={{ cursor: 'pointer' }}
                >
                  <Typography fontFamily="IBM Plex Mono" fontSize={12} fontWeight={500} textTransform="uppercase">
                    {t('Whitdraw')}
                  </Typography>
                </Box>
              )}
            </Box>
          </Box>
          <Divider orientation="vertical" sx={{ borderColor: 'grey.200', my: 0.6 }} flexItem />
          <Box display="flex" flexDirection="column" gap={0.5}>
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
                <Typography variant="h6" fontWeight={400} data-testid={`vesting-stream-${tokenId}-withdrawable`}>
                  {formatNumber(Number(withdrawable) / 1e18)}
                </Typography>
              )}
              <Typography fontSize={14} color="grey.400" data-testid={`vesting-stream-${tokenId}-left`}>
                / {formatNumber(Number(depositAmount - withdrawnAmount) / 1e18)}
              </Typography>
            </Box>
          </Box>
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
      <Box display="flex" justifyContent="space-between">
        <Box display="flex" gap={1}>
          <Typography fontSize={14} fontWeight={700} noWrap>
            {t('Vesting Period')}:
          </Typography>
          <Typography fontSize={14} fontWeight={400} data-testid={`vesting-stream-${tokenId}-timeleft`}>
            {timeLeft}
          </Typography>
        </Box>
        <CustomProgressBar value={progress} data-testid={`vesting-stream-${tokenId}-progress`} />
      </Box>
    </Box>
  );
};

export default React.memo(ActiveStream);
