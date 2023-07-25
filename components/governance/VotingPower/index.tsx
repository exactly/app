import React, { useMemo } from 'react';
import { Box, Skeleton, Typography } from '@mui/material';
import { formatEther } from 'viem';
import { useTranslation } from 'react-i18next';
import { useEXAGetVotes, useEXADelegates } from 'hooks/useEXA';
import formatNumber from 'utils/formatNumber';
import { useWeb3 } from 'hooks/useWeb3';
import { useAirdropStreams } from 'hooks/useAirdrop';
import { useSablierV2LockupLinearGetWithdrawnAmount } from 'hooks/useSablier';

type Props = {
  amount: bigint;
};

const VotingPower = ({ amount }: Props) => {
  const { t } = useTranslation();
  const { walletAddress } = useWeb3();
  const { data: votes, isLoading } = useEXAGetVotes({ watch: true });
  const { data: stream } = useAirdropStreams({ watch: true });
  const { data: delegatee, isLoading: isLoadingDelegatee } = useEXADelegates({ watch: true });
  const { data: withdrawn, isLoading: isLoadingWithdrawn } = useSablierV2LockupLinearGetWithdrawnAmount(stream);

  const totalVotes = useMemo(() => {
    return (votes ?? 0n) + (delegatee === walletAddress ? amount - (withdrawn ?? 0n) : 0n);
  }, [votes, amount, walletAddress, delegatee, withdrawn]);

  return (
    <Box display="flex" flexDirection="column" gap={4}>
      <Box display="flex" justifyContent="space-between" alignItems="center">
        <Typography variant="h6">{t('Voting Power')}</Typography>
        {votes === undefined || isLoadingDelegatee || isLoadingWithdrawn || isLoading ? (
          <Skeleton width={56} height={40} />
        ) : (
          <Typography fontSize={28} color="grey.700">
            {formatNumber(formatEther(totalVotes))}
          </Typography>
        )}
      </Box>
      {votes === 0n && (
        <Typography fontSize={14} color="grey.500">
          {t('You have no voting power in your connected wallet.')}
        </Typography>
      )}
    </Box>
  );
};

export default VotingPower;
