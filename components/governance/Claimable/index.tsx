import React, { FC, useCallback, useMemo } from 'react';
import { Hex, formatEther, parseEther } from 'viem';
import Image from 'next/image';
import { useNetwork, useSwitchNetwork } from 'wagmi';
import useWaitForTransaction from 'hooks/useWaitForTransaction';
import { Box, Button, Divider, Skeleton, Typography } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { LoadingButton } from '@mui/lab';
import { usePrepareAirdropClaim, useAirdropClaimed, useAirdropStreams } from 'hooks/useAirdrop';
import { useWeb3 } from 'hooks/useWeb3';
import {
  useSablierV2LockupLinearWithdrawableAmountOf,
  useSablierV2NftDescriptorTokenUri,
  usePrepareSablierV2LockupLinearWithdrawMax,
} from 'hooks/useSablier';
import { useAirdropClaim, useSablierV2LockupLinearWithdrawMax } from 'types/abi';
import formatNumber from 'utils/formatNumber';
import { track } from 'utils/mixpanel';

type ClaimableProps = {
  amount: bigint;
  proof: Hex[];
};

const Claimable: FC<ClaimableProps> = ({ amount, proof }) => {
  const { t } = useTranslation();
  const { chain: displayNetwork, impersonateActive, exitImpersonate } = useWeb3();
  const parsedAmount = useMemo(() => (amount ? formatNumber(formatEther(amount)) : '0'), [amount]);

  const { data: claimed, isLoading: isLoadingClaimed, refetch } = useAirdropClaimed();

  const { chain } = useNetwork();
  const { switchNetwork, isLoading: switchIsLoading } = useSwitchNetwork();

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
      ) : chain && chain.id !== displayNetwork.id ? (
        <LoadingButton
          variant="contained"
          fullWidth
          onClick={() => switchNetwork?.(displayNetwork.id)}
          loading={switchIsLoading}
        >
          {t('Please switch to {{network}} network', { network: displayNetwork.name })}
        </LoadingButton>
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

  const { config } = usePrepareAirdropClaim({ args: [amount, proof] });
  const { write: claim, data: claimData, isLoading: claimLoading } = useAirdropClaim(config);
  const { isLoading: waitingClaim } = useWaitForTransaction({
    hash: claimData?.hash,
    onSettled: refresh,
  });
  const handleClick = useCallback(() => {
    claim?.();
    track('Button Clicked', {
      location: 'Governance',
      name: 'claim',
      value: formatNumber(formatEther(amount)),
    });
  }, [amount, claim]);

  return (
    <LoadingButton
      variant="contained"
      fullWidth
      onClick={handleClick}
      disabled={claimLoading || waitingClaim}
      loading={claimLoading || waitingClaim}
    >
      {t('Claim EXA Stream')}
    </LoadingButton>
  );
};

const NFT: FC = () => {
  const { t } = useTranslation();
  const { data: stream } = useAirdropStreams();
  const {
    data: withdrawable,
    isLoading: isLoadingWithdrawable,
    refetch,
  } = useSablierV2LockupLinearWithdrawableAmountOf(stream);
  const { data: nft, isLoading: isLoadingNFT } = useSablierV2NftDescriptorTokenUri(stream);

  const { config: withdrawConfig } = usePrepareSablierV2LockupLinearWithdrawMax(stream);
  const {
    write: withdraw,
    data: withdrawData,
    isLoading: withdrawLoading,
  } = useSablierV2LockupLinearWithdrawMax(withdrawConfig);
  const { isLoading: waitingWithdraw } = useWaitForTransaction({
    hash: withdrawData?.hash,
    onSettled: () => refetch(),
  });

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
        onClick={withdraw}
        disabled={
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
