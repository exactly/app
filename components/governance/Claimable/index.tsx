import React, { FC, useCallback, useEffect, useMemo } from 'react';
import { formatEther, parseEther, type Hex } from 'viem';
import Image from 'next/image';
import { Box, Button, Divider, Skeleton, Typography } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { LoadingButton } from '@mui/lab';
import MainActionButton from 'components/common/MainActionButton';
import {
  airdropAddress,
  sablierV2LockupLinearAddress,
  sablierV2NftDescriptorAddress,
  useReadAirdropClaimed,
  useReadAirdropStreams,
  useReadSablierV2LockupLinearWithdrawableAmountOf,
  useReadSablierV2NftDescriptorTokenUri,
  useSimulateAirdropClaim,
  useSimulateSablierV2LockupLinearWithdrawMax,
  useWriteAirdropClaim,
  useWriteSablierV2LockupLinearWithdrawMax,
} from 'generated/wagmi';
import formatNumber from 'utils/formatNumber';
import { track } from 'utils/mixpanel';
import { useWaitForTransactionReceipt } from 'wagmi';
import useReadOnly from 'hooks/useReadOnly';
import { defaultChain } from 'utils/client';

type ClaimableProps = {
  amount: bigint;
  proof: Hex[];
};

const airdropChainId = Object.keys(airdropAddress)
  .map(Number)
  .find((chainId): chainId is keyof typeof airdropAddress => chainId === defaultChain.id);
const sablierV2LockupLinearChainId = Object.keys(sablierV2LockupLinearAddress)
  .map(Number)
  .find((chainId): chainId is keyof typeof sablierV2LockupLinearAddress => chainId === defaultChain.id);
const sablierV2NftDescriptorChainId = Object.keys(sablierV2NftDescriptorAddress)
  .map(Number)
  .find((chainId): chainId is keyof typeof sablierV2NftDescriptorAddress => chainId === defaultChain.id);

const Claimable: FC<ClaimableProps> = ({ amount, proof }) => {
  const { t } = useTranslation();
  const { account: walletAddress, isImpersonating: impersonateActive, exitReadOnly: exitImpersonate } = useReadOnly();
  const parsedAmount = useMemo(() => (amount ? formatNumber(formatEther(amount)) : '0'), [amount]);

  const {
    data: claimed,
    isLoading: isLoadingClaimed,
    refetch,
  } = useReadAirdropClaimed({
    chainId: airdropChainId,
    args: walletAddress ? [walletAddress] : undefined,
    query: { enabled: Boolean(walletAddress && airdropChainId !== undefined) },
  });

  return (
    <Box display="flex" flexDirection="column" gap={4}>
      <Box display="flex" justifyContent="space-between" alignItems="center">
        <Typography variant="h6">{claimed ? t('Claimed') : t('Claimable')}</Typography>
        <Box display="flex" gap={1} alignItems="center">
          {claimed === undefined || isLoadingClaimed ? (
            <Skeleton width={60} height={32} />
          ) : (
            <>
              <Image
                src={`/img/assets/EXA.svg`}
                alt=""
                width={24}
                height={24}
                style={{ maxWidth: '100%', height: 'auto' }}
              />
              <Typography variant="h6">{parsedAmount}</Typography>
            </>
          )}
        </Box>
      </Box>

      {impersonateActive ? (
        <Button fullWidth onClick={exitImpersonate} variant="contained">
          {t('Exit Read-Only Mode')}
        </Button>
      ) : claimed ? (
        <NFT />
      ) : (
        <Claim amount={amount} proof={proof} refresh={refetch} />
      )}

      <Divider flexItem />
    </Box>
  );
};

const Claim: FC<ClaimableProps & { refresh: () => void }> = ({ amount, proof, refresh }) => {
  const { t } = useTranslation();
  const { account: walletAddress } = useReadOnly();

  const { data: claimSimulation } = useSimulateAirdropClaim({
    account: walletAddress,
    chainId: airdropChainId,
    args: [amount, proof],
    query: { enabled: Boolean(walletAddress && airdropChainId !== undefined) },
  });
  const { mutate: claim, data: claimHash, isPending: claimLoading } = useWriteAirdropClaim();
  const {
    data: claimReceipt,
    error: claimError,
    isLoading: waitingClaim,
  } = useWaitForTransactionReceipt({
    hash: claimHash,
    query: {
      enabled: Boolean(claimHash),
    },
  });

  useEffect(() => {
    if (!claimReceipt && !claimError) return;
    refresh();
  }, [claimError, claimReceipt, refresh]);

  const handleClick = useCallback(() => {
    if (!claimSimulation) return;
    claim(claimSimulation.request);
    track('Button Clicked', {
      location: 'Governance',
      name: 'claim',
      value: formatNumber(formatEther(amount)),
    });
  }, [amount, claim, claimSimulation]);

  return (
    <MainActionButton
      variant="contained"
      fullWidth
      onClick={handleClick}
      disabled={!claimSimulation || claimLoading || waitingClaim}
      loading={claimLoading || waitingClaim}
    >
      {t('Claim EXA Stream')}
    </MainActionButton>
  );
};

const NFT: FC = () => {
  const { t } = useTranslation();
  const { account: walletAddress } = useReadOnly();
  const { data: stream } = useReadAirdropStreams({
    chainId: airdropChainId,
    args: walletAddress ? [walletAddress] : undefined,
    query: { enabled: Boolean(walletAddress && airdropChainId !== undefined) },
  });
  const {
    data: withdrawable,
    isLoading: isLoadingWithdrawable,
    refetch,
  } = useReadSablierV2LockupLinearWithdrawableAmountOf({
    chainId: sablierV2LockupLinearChainId,
    args: stream !== undefined ? [stream] : undefined,
    query: { enabled: Boolean(stream !== undefined && sablierV2LockupLinearChainId !== undefined) },
  });
  const { data: nft, isLoading: isLoadingNFT } = useReadSablierV2NftDescriptorTokenUri({
    chainId: sablierV2NftDescriptorChainId,
    args:
      stream !== undefined && sablierV2LockupLinearChainId !== undefined
        ? [sablierV2LockupLinearAddress[sablierV2LockupLinearChainId], stream]
        : undefined,
    query: {
      enabled: Boolean(
        stream !== undefined &&
          sablierV2LockupLinearChainId !== undefined &&
          sablierV2NftDescriptorChainId !== undefined,
      ),
    },
  });

  const { data: withdrawSimulation } = useSimulateSablierV2LockupLinearWithdrawMax({
    chainId: sablierV2LockupLinearChainId,
    args: stream !== undefined && walletAddress ? [stream, walletAddress] : undefined,
    query: {
      enabled: Boolean(stream !== undefined && walletAddress && sablierV2LockupLinearChainId !== undefined),
    },
  });
  const {
    mutate: withdraw,
    data: withdrawHash,
    isPending: withdrawLoading,
  } = useWriteSablierV2LockupLinearWithdrawMax();
  const {
    data: withdrawReceipt,
    error: withdrawError,
    isLoading: waitingWithdraw,
  } = useWaitForTransactionReceipt({
    hash: withdrawHash,
    query: {
      enabled: Boolean(withdrawHash),
    },
  });

  useEffect(() => {
    if (!withdrawReceipt && !withdrawError) return;
    refetch();
  }, [refetch, withdrawError, withdrawReceipt]);

  const handleWithdraw = useCallback(() => {
    if (!withdrawSimulation) return;
    withdraw(withdrawSimulation.request);
  }, [withdraw, withdrawSimulation]);

  const b64 = nft?.split(',')[1] ?? '';
  const json = atob(b64) || '{}';
  const { image, description, name } = JSON.parse(json);
  const title = name ?? '';
  const sablierDescription: string[] = (description?.split('\n') ?? ([] as string[]))[0];

  return (
    <>
      <LoadingButton
        variant="contained"
        fullWidth
        onClick={handleWithdraw}
        disabled={
          !withdrawSimulation ||
          withdrawLoading ||
          waitingWithdraw ||
          isLoadingWithdrawable ||
          (withdrawable ?? 0n) < parseEther('0.0049999999')
        }
        loading={withdrawLoading || waitingWithdraw || isLoadingWithdrawable}
      >
        {t('Withdraw {{ value }} EXA', { value: formatNumber(formatEther(withdrawable ?? 0n)) })}
      </LoadingButton>
      {nft === undefined || isLoadingNFT ? (
        <Skeleton sx={{ borderRadius: '8px' }} variant="rectangular" height={416} />
      ) : (
        <Box display="flex" flexDirection="column" gap={4}>
          <Image
            style={{
              borderRadius: '8px',
              maxWidth: '100%',
              height: 'auto',
            }}
            src={image}
            alt={description}
            width={416}
            height={416}
          />
          <Box display="flex" flexDirection="column" gap={1}>
            <Typography variant="h6">{title}</Typography>
            <Typography fontSize={14}>{sablierDescription}</Typography>
          </Box>
        </Box>
      )}
    </>
  );
};

export default React.memo(Claimable);
