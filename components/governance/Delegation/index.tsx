import React, { useMemo, useState } from 'react';
import { Avatar, Box, Collapse, Divider, Skeleton, TextField, Typography } from '@mui/material';
import { Trans, useTranslation } from 'react-i18next';
import { LoadingButton } from '@mui/lab';
import HowToVoteIcon from '@mui/icons-material/HowToVote';
import AddIcon from '@mui/icons-material/Add';
import { isAddress, parseEther, zeroAddress, formatEther } from 'viem';
import { formatWallet } from 'utils/utils';
import { useEXA, useEXADelegates, useEXAPrepareDelegate } from 'hooks/useEXA';
import formatNumber from 'utils/formatNumber';
import useBalance from 'hooks/useBalance';
import { useWeb3 } from 'hooks/useWeb3';
import { useExaDelegate } from 'types/abi';
import { mainnet, useEnsAvatar, useEnsName, useNetwork, useSwitchNetwork, useWaitForTransaction } from 'wagmi';
import * as blockies from 'blockies-ts';
import { useAirdropStreams } from 'hooks/useAirdrop';
import { useSablierV2LockupLinearGetWithdrawnAmount } from 'hooks/useSablier';

type Props = {
  amount: bigint;
};

const Delegation = ({ amount }: Props) => {
  const { t } = useTranslation();
  const { chain: displayNetwork, walletAddress } = useWeb3();
  const [selected, setSelected] = useState<'self-delegate' | 'add-delegate'>('self-delegate');
  const [input, setInput] = useState<string>('');
  const exa = useEXA();
  const exaBalance = useBalance('EXA', exa?.address);
  const { data: delegate, isLoading: isLoadingDelegate } = useEXADelegates({ watch: true });
  const { config } = useEXAPrepareDelegate({
    args:
      delegate !== zeroAddress
        ? [zeroAddress]
        : selected === 'add-delegate' && isAddress(input)
        ? [input]
        : [walletAddress ?? zeroAddress],
  });
  const { write, isLoading: submitLoading, data } = useExaDelegate(config);
  const { isLoading: waitingDelegate } = useWaitForTransaction({ hash: data?.hash });
  const { data: delegateENS } = useEnsName({ address: delegate, chainId: mainnet.id });
  const { data: delegateENSAvatar, error: ensAvatarError } = useEnsAvatar({
    name: delegateENS,
    chainId: mainnet.id,
  });

  const { chain } = useNetwork();
  const { switchNetwork, isLoading: switchIsLoading } = useSwitchNetwork();

  const { data: stream } = useAirdropStreams({ watch: true });
  const { data: withdrawn } = useSablierV2LockupLinearGetWithdrawnAmount(stream);

  const totalVotes = useMemo(() => {
    return formatNumber(formatEther(parseEther(exaBalance ?? '0') + (amount - (withdrawn ?? 0n))));
  }, [exaBalance, amount, withdrawn]);

  const delegateAvatar = useMemo(() => {
    if (!delegate) return '';
    if (delegateENSAvatar && !ensAvatarError) return delegateENSAvatar;
    return blockies.create({ seed: delegate.toLocaleLowerCase() }).toDataURL();
  }, [delegate, delegateENSAvatar, ensAvatarError]);

  if (isLoadingDelegate) {
    return (
      <Box display="flex" flexDirection="column" gap={4}>
        <Divider flexItem />
        <Skeleton height={60} />
        <Skeleton height={60} />
      </Box>
    );
  }

  if (delegate !== zeroAddress) {
    return (
      <Box display="flex" flexDirection="column" gap={4}>
        <Divider flexItem />
        <Box display="flex" flexDirection="column" gap={3}>
          <Typography variant="h6">{t('Votes Delegation')}</Typography>
          {exaBalance !== undefined ? (
            <Typography fontSize={14}>
              <Trans
                i18nKey="Your total of <1>{{amount}} voting power</1> is currently delegated to the following address:"
                components={{
                  1: <strong></strong>,
                }}
                values={{ amount: totalVotes }}
              />
            </Typography>
          ) : (
            <Skeleton />
          )}
        </Box>
        <Box display="flex" gap={1}>
          <Avatar alt="Delegate avatar" src={delegateAvatar} sx={{ width: 24, height: 24 }} />
          <Typography fontSize={16} fontFamily="IBM Plex Mono">
            {delegateENS ? delegateENS : formatWallet(delegate)}
          </Typography>
        </Box>
        {chain && chain.id !== displayNetwork.id ? (
          <LoadingButton
            fullWidth
            variant="outlined"
            onClick={() => switchNetwork?.(displayNetwork.id)}
            loading={switchIsLoading}
          >
            {t('Please switch to {{network}} network', { network: displayNetwork.name })}
          </LoadingButton>
        ) : (
          <LoadingButton fullWidth variant="outlined" onClick={write} loading={submitLoading || waitingDelegate}>
            {t('Revoke delegation')}
          </LoadingButton>
        )}
      </Box>
    );
  }

  return (
    <Box display="flex" flexDirection="column" gap={4}>
      <Divider flexItem />
      <Box display="flex" flexDirection="column" gap={3}>
        <Typography variant="h6">{t('Votes Delegation')}</Typography>
        {exaBalance !== undefined ? (
          <Typography fontSize={14}>
            <Trans
              i18nKey="You have a total of <1>{{amount}} voting power</1> available to delegate."
              components={{
                1: <strong></strong>,
              }}
              values={{ amount: totalVotes }}
            />
          </Typography>
        ) : (
          <Skeleton />
        )}
      </Box>
      <Box display="flex" flexDirection="column">
        <Box
          display="flex"
          flexDirection="column"
          p={3}
          gap={2}
          border={({ palette }) => `1px solid ${palette.figma.grey[100]}`}
          borderRadius="8px"
          sx={{
            '&:hover': {
              cursor: 'pointer',
              bgcolor: 'grey.900',
              color: 'grey.50',
            },
            bgcolor: selected === 'self-delegate' ? 'grey.900' : '',
            color: selected === 'self-delegate' ? 'grey.50' : '',
            pointerEvents: submitLoading || waitingDelegate ? 'none' : 'auto',
          }}
          onClick={() => setSelected('self-delegate')}
        >
          <Box display="flex" gap={1} alignItems="center">
            <HowToVoteIcon sx={{ fontSize: 24 }} />
            <Typography variant="h6">{t('Self Delegate')}</Typography>
          </Box>
          <Typography fontSize={14}>
            {t('Use your voting rights to vote on proposals directly from your connected wallet.')}
          </Typography>
        </Box>
        <Box
          display="flex"
          flexDirection="column"
          p={3}
          gap={2}
          mt={2}
          border={({ palette }) => `1px solid ${palette.figma.grey[100]}`}
          borderRadius="8px"
          sx={{
            '&:hover': {
              cursor: 'pointer',
              bgcolor: 'grey.900',
              color: 'grey.50',
            },
            bgcolor: selected === 'add-delegate' ? 'grey.900' : '',
            color: selected === 'add-delegate' ? 'grey.50' : '',
            pointerEvents: submitLoading || waitingDelegate ? 'none' : 'auto',
          }}
          onClick={() => setSelected('add-delegate')}
        >
          <Box display="flex" gap={1} alignItems="center">
            <AddIcon sx={{ fontSize: 24 }} />
            <Typography variant="h6">{t('Add Delegate')}</Typography>
          </Box>
          <Typography fontSize={14}>
            {t(
              'Delegate your voting rights to a trusted third-party Ethereum address. You never send EXA tokens, only your voting rights and can revoke the delegation at any time.',
            )}
          </Typography>
        </Box>
        <Collapse in={selected === 'add-delegate'}>
          <Box display="flex" flexDirection="column" gap={4} mt={4}>
            <Typography fontSize={14}>
              {t(
                'Enter the address of the third-party you wish to delegate your voting rights to below. You can also check the Delegates List and find someone to represent you.',
              )}
            </Typography>
            <TextField
              variant="outlined"
              fullWidth
              size="small"
              placeholder={t('Enter delegate address') || ''}
              sx={{
                '& .MuiOutlinedInput-root': {
                  p: 0.5,
                  fontSize: 14,
                  '&.Mui-focused fieldset': {
                    border: '1px solid',
                  },
                },
              }}
              disabled={submitLoading || waitingDelegate}
              onChange={(e) => setInput(e.target.value)}
            />
          </Box>
        </Collapse>
      </Box>
      {chain && chain.id !== displayNetwork.id ? (
        <LoadingButton
          variant="contained"
          fullWidth
          onClick={() => switchNetwork?.(displayNetwork.id)}
          loading={switchIsLoading}
        >
          {t('Please switch to {{network}} network', { network: displayNetwork.name })}
        </LoadingButton>
      ) : (
        <LoadingButton
          variant="contained"
          fullWidth
          disabled={selected === 'add-delegate' && !(input && isAddress(input))}
          onClick={write}
          loading={submitLoading || waitingDelegate}
        >
          {selected === 'add-delegate' && Boolean(input && isAddress(input))
            ? `${t('Delegate Votes to')} ${formatWallet(input)}`
            : t('Delegate Votes')}
        </LoadingButton>
      )}
    </Box>
  );
};

export default Delegation;
