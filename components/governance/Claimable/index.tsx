import React, { FC, useMemo } from 'react';
import { Hex, formatEther } from 'viem';
import { Box, Divider, Typography } from '@mui/material';
import { useTranslation } from 'react-i18next';
import Image from 'next/image';
import { LoadingButton } from '@mui/lab';
import { usePrepareAirdropClaim, useAirdropClaimed } from 'hooks/useAirdrop';
import { useAirdropClaim } from 'types/abi';
import { useWaitForTransaction } from 'wagmi';
import formatNumber from 'utils/formatNumber';

type ClaimableProps = {
  amount: bigint;
  proof: Hex[];
};

const Claimable: FC<ClaimableProps> = ({ amount, proof }) => {
  const { t } = useTranslation();
  const parsedAmount = useMemo(() => (amount ? formatNumber(formatEther(amount)) : '0'), [amount]);

  const { data: claimed, isLoading } = useAirdropClaimed({ watch: true });
  const { config } = usePrepareAirdropClaim({ args: [amount, proof] });
  const { write, data, isLoading: submitLoading } = useAirdropClaim(config);
  const { isLoading: waitingClaim } = useWaitForTransaction({ hash: data?.hash });

  return (
    <Box display="flex" flexDirection="column" gap={4}>
      <Box display="flex" justifyContent="space-between" alignItems="center">
        <Box display="flex" alignItems="center" gap={1}>
          <Typography variant="h6">{t('Claimable')}</Typography>
        </Box>
        <Box display="flex" gap={1} alignItems="center">
          <Image
            src={`/img/assets/EXA.svg`}
            alt=""
            width={24}
            height={24}
            style={{ maxWidth: '100%', height: 'auto' }}
          />
          <Typography variant="h6">{claimed ? '0' : parsedAmount}</Typography>
        </Box>
      </Box>
      <LoadingButton
        variant="contained"
        fullWidth
        onClick={write}
        disabled={submitLoading || waitingClaim || claimed}
        loading={isLoading || submitLoading || waitingClaim}
      >
        {claimed ? t('EXA Claimed') : t('Claim EXA')}
      </LoadingButton>
      <Typography fontSize={14} color="grey.500">
        {t(
          'When claiming your EXA you are also delegating your voting power to yourself. You can always choose to delegate it to another address later on.',
        )}{' '}
        <a
          href="https://docs.exact.ly/"
          target="_blank"
          rel="noreferrer noopener"
          style={{ textDecoration: 'underline' }}
        >
          {t('Learn more about delegation.')}
        </a>
      </Typography>
      <Divider flexItem />
    </Box>
  );
};

export default Claimable;
