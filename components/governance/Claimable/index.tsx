import React, { FC, useMemo } from 'react';
import { Hex, formatEther, parseEther } from 'viem';
import Image from 'next/image';
import { useWaitForTransaction } from 'wagmi';
import { Box, Divider, Skeleton, Typography } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { LoadingButton } from '@mui/lab';
import { usePrepareAirdropClaim, useAirdropClaimed, useAirdropStreams } from 'hooks/useAirdrop';
import {
  useSablierV2LockupLinearWithdrawableAmountOf,
  useSablierV2NftDescriptorTokenUri,
  usePrepareSablierV2LockupLinearWithdrawMax,
} from 'hooks/useSablier';
import { useAirdropClaim, useSablierV2LockupLinearWithdrawMax } from 'types/abi';
import formatNumber from 'utils/formatNumber';

type ClaimableProps = {
  amount: bigint;
  proof: Hex[];
};

const Claimable: FC<ClaimableProps> = ({ amount, proof }) => {
  const { t } = useTranslation();
  const parsedAmount = useMemo(() => (amount ? formatNumber(formatEther(amount)) : '0'), [amount]);

  const { data: claimed, isLoading: isLoadingClaimed } = useAirdropClaimed({ watch: true });
  const { data: stream } = useAirdropStreams({ watch: true });
  const { data: withdrawable, isLoading: isLoadingWithdrawable } = useSablierV2LockupLinearWithdrawableAmountOf(stream);
  const { data: nft, isLoading: isLoadingNFT } = useSablierV2NftDescriptorTokenUri(stream);

  const { config } = usePrepareAirdropClaim({ args: [amount, proof] });
  const { write: claim, data: claimData, isLoading: claimLoading } = useAirdropClaim(config);
  const { isLoading: waitingClaim } = useWaitForTransaction({ hash: claimData?.hash });

  const { config: withdrawConfig } = usePrepareSablierV2LockupLinearWithdrawMax(stream);
  const {
    write: withdraw,
    data: withdrawData,
    isLoading: withdrawLoading,
  } = useSablierV2LockupLinearWithdrawMax(withdrawConfig);
  const { isLoading: waitingWithdraw } = useWaitForTransaction({ hash: withdrawData?.hash });

  const b64 = nft?.split(',')[1] ?? '';
  const json = atob(b64) || '{}';
  const { image, description } = JSON.parse(json);

  return (
    <Box display="flex" flexDirection="column" gap={4}>
      <Box display="flex" justifyContent="space-between" alignItems="center">
        <Box display="flex" alignItems="center" gap={1}>
          <Typography variant="h6">{t('Claimable')}</Typography>
        </Box>
        <Box display="flex" gap={1} alignItems="center">
          {claimed === undefined || claimed || isLoadingClaimed || isLoadingNFT ? null : (
            <>
              <Image
                src={`/img/assets/EXA.svg`}
                alt=""
                width={24}
                height={24}
                style={{ maxWidth: '100%', height: 'auto' }}
              />
              <Typography variant="h6">
                {isLoadingClaimed ? <Skeleton width={60} height={32} /> : parsedAmount}
              </Typography>
            </>
          )}
        </Box>
      </Box>
      {nft === undefined || isLoadingNFT ? (
        <Skeleton sx={{ borderRadius: '8px' }} variant="rectangular" width={416} height={416} />
      ) : (
        <Image style={{ borderRadius: '8px' }} src={image} alt={description} width={416} height={416} />
      )}
      {claimed ? (
        <LoadingButton
          variant="contained"
          fullWidth
          onClick={withdraw}
          disabled={
            withdrawLoading || waitingWithdraw || isLoadingWithdrawable || (withdrawable ?? 0n) < parseEther('0.01')
          }
          loading={withdrawLoading || waitingWithdraw || isLoadingWithdrawable}
        >
          {t('Withdraw {{ value }} EXA', { value: formatNumber(formatEther(withdrawable ?? 0n)) })}
        </LoadingButton>
      ) : (
        <LoadingButton
          variant="contained"
          fullWidth
          onClick={claim}
          disabled={claimLoading || waitingClaim}
          loading={isLoadingClaimed || claimLoading || waitingClaim}
        >
          {t('Claim EXA')}
        </LoadingButton>
      )}
      <Divider flexItem />
    </Box>
  );
};

export default Claimable;
