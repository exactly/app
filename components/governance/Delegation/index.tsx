import React, { FC, useCallback, useMemo, useState } from 'react';
import {
  Avatar,
  Box,
  Button,
  Dialog,
  Divider,
  IconButton,
  Skeleton,
  Slide,
  TextField,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';

import { useTranslation } from 'react-i18next';
import { LoadingButton } from '@mui/lab';
import { isAddress, zeroAddress } from 'viem';
import { formatWallet } from 'utils/utils';
import { useWeb3 } from 'hooks/useWeb3';
import { useDelegateRegistryClearDelegate, useDelegateRegistrySetDelegate } from 'types/abi';
import { mainnet, useEnsAvatar, useEnsName } from 'wagmi';
import useWaitForTransaction from 'hooks/useWaitForTransaction';
import * as blockies from 'blockies-ts';
import { useDelegation, usePrepareClearDelegate, usePrepareDelegate } from 'hooks/useDelegateRegistry';
import formatNumber from 'utils/formatNumber';
import useGovernance from 'hooks/useGovernance';
import { track } from 'utils/mixpanel';
import MainActionButton from 'components/common/MainActionButton';

const Delegation = () => {
  const { votingPower: yourVotes } = useGovernance(false);
  const { votingPower, fetchVotingPower } = useGovernance();
  const { t } = useTranslation();
  const { walletAddress, impersonateActive, exitImpersonate } = useWeb3();
  const [open, setOpen] = useState<boolean>(false);
  const [input, setInput] = useState<string>('');
  const { data: delegate, isLoading: isLoadingDelegate, refetch: refetchDelegate } = useDelegation();
  const { config } = usePrepareDelegate(isAddress(input) ? input : zeroAddress);
  const { write, isLoading: submitLoading, data } = useDelegateRegistrySetDelegate(config);
  const { config: configClearDelegate } = usePrepareClearDelegate(delegate !== zeroAddress);
  const {
    write: writeClearDelegate,
    isLoading: clearDelegateLoading,
    data: clearDelegateData,
  } = useDelegateRegistryClearDelegate(configClearDelegate);
  const { isLoading: waitingDelegate } = useWaitForTransaction({
    hash: data?.hash,
    onSettled: () => {
      refetchDelegate();
      fetchVotingPower();
      setOpen(false);
    },
  });
  const { isLoading: waitingClearDelegate } = useWaitForTransaction({
    hash: clearDelegateData?.hash,
    onSettled: () => {
      refetchDelegate();
      fetchVotingPower();
    },
  });
  const { data: delegateENS } = useEnsName({
    address: delegate === zeroAddress ? walletAddress : delegate,
    chainId: mainnet.id,
  });
  const { data: delegateENSAvatar, error: ensAvatarError } = useEnsAvatar({
    name: delegateENS,
    chainId: mainnet.id,
  });

  const delegateAvatar = useMemo(() => {
    if (!delegate) return '';
    if (delegateENSAvatar && !ensAvatarError) return delegateENSAvatar;
    return blockies
      .create({ seed: (delegate === zeroAddress ? walletAddress : delegate)?.toLocaleLowerCase() })
      .toDataURL();
  }, [delegate, delegateENSAvatar, ensAvatarError, walletAddress]);

  const handleDelegateClick = useCallback(() => {
    setOpen(true);
    track('Button Clicked', {
      location: 'Governance',
      name: 'delegate',
      value: votingPower,
    });
  }, [votingPower]);

  const handleModalClose = useCallback(() => {
    setOpen(false);
    track('Modal Closed', {
      name: 'delegation',
      location: 'Governance',
    });
  }, []);

  const delegatedToYou = useMemo(() => {
    if (votingPower === undefined || yourVotes === undefined) return undefined;
    return delegate === zeroAddress && votingPower - yourVotes >= 0 ? votingPower - yourVotes : votingPower;
  }, [delegate, votingPower, yourVotes]);

  if (isLoadingDelegate) {
    return (
      <Box display="flex" flexDirection="column" gap={4}>
        <Divider flexItem />
        <Skeleton height={60} />
        <Skeleton height={60} />
      </Box>
    );
  }

  return (
    <Box display="flex" flexDirection="column" gap={4}>
      <DelegateInputDialog
        open={open}
        onClose={handleModalClose}
        input={input}
        setInput={setInput}
        onDelegate={write}
        isLoading={submitLoading || waitingDelegate}
      />
      <Box display="flex" flexDirection="column" gap={3}>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Typography variant="h6">{t('Voting Power')}</Typography>
          {votingPower === undefined ? (
            <Skeleton width={56} height={40} />
          ) : (
            <Typography fontSize={28} color="grey.700">
              {votingPower === 0 ? 0 : formatNumber(votingPower, 'USD', true)}
            </Typography>
          )}
        </Box>
        {votingPower !== undefined && yourVotes !== undefined && delegatedToYou !== undefined ? (
          yourVotes === 0 && votingPower === 0 ? (
            <Typography fontSize={14} color="grey.500">
              {t('There is no voting power in the connected wallet, and no votes have been delegated to you.')}
            </Typography>
          ) : (
            <Box display="flex" flexDirection="column" gap={2}>
              <Box display="flex" justifyContent="space-between" alignItems="center">
                <Typography>{t('Delegated to you')}</Typography>
                <Typography fontWeight={600}>
                  {delegatedToYou === 0 ? 0 : formatNumber(delegatedToYou, 'USD', true)}
                </Typography>
              </Box>
              <Box display="flex" justifyContent="space-between" alignItems="center" gap={2}>
                {delegate === zeroAddress ? (
                  <Typography>{t('On connected wallet')}</Typography>
                ) : (
                  <Box display="flex" alignItems="center" gap={1}>
                    <Typography>{t('Delegated to')}</Typography>
                    <Box display="flex" alignItems="center" gap={1}>
                      <Avatar alt="Delegate avatar" src={delegateAvatar} sx={{ width: 16, height: 16 }} />
                      <Typography fontSize={16} fontFamily="IBM Plex Mono">
                        {delegateENS ? delegateENS : formatWallet(delegate === zeroAddress ? walletAddress : delegate)}
                      </Typography>
                    </Box>
                  </Box>
                )}
                <Typography fontWeight={600}>{yourVotes === 0 ? 0 : formatNumber(yourVotes, 'USD', true)}</Typography>
              </Box>
            </Box>
          )
        ) : (
          <Skeleton height={30} />
        )}
      </Box>

      {impersonateActive ? (
        <Button fullWidth onClick={exitImpersonate} variant="contained">
          {t('Exit Read-Only Mode')}
        </Button>
      ) : (
        <Box display="flex" gap={1}>
          <MainActionButton
            variant="contained"
            fullWidth
            onClick={handleDelegateClick}
            loading={submitLoading || waitingDelegate}
          >
            {t('Delegate votes')}
          </MainActionButton>
          {delegate !== zeroAddress && (
            <MainActionButton
              fullWidth
              variant="outlined"
              onClick={writeClearDelegate}
              loading={clearDelegateLoading || waitingClearDelegate || waitingDelegate}
            >
              {t('Revoke delegation')}
            </MainActionButton>
          )}
        </Box>
      )}
      <Typography fontSize={14} color="grey.500">
        {t(
          'Delegate your voting rights to a trusted third-party Ethereum address. You never send EXA tokens, only your voting rights and can re-delegate or revoke the delegation at any time.',
        )}
      </Typography>
    </Box>
  );
};

type DelegateInputDialogProps = {
  open: boolean;
  onClose: () => void;
  input: string;
  setInput: (input: string) => void;
  onDelegate?: () => void;
  isLoading?: boolean;
};

const DelegateInputDialog: FC<DelegateInputDialogProps> = ({
  open,
  onClose,
  input,
  setInput,
  onDelegate,
  isLoading,
}) => {
  const { walletAddress } = useWeb3();
  const { t } = useTranslation();
  const { breakpoints } = useTheme();
  const isMobile = useMediaQuery(breakpoints.down('md'));
  const handleClose = useCallback(() => {
    onClose();
    track('Modal Closed', {
      name: 'delegation',
      location: 'Governance',
    });
  }, [onClose]);
  const handleBlur = useCallback(() => {
    track('Input Unfocused', {
      name: 'delegation address',
      location: 'Governance',
      value: input,
    });
  }, [input]);

  const handleDelegateClick = useCallback(() => {
    onDelegate?.();
    track('Button Clicked', {
      location: 'Governance',
      name: 'delegate',
      value: input,
    });
  }, [input, onDelegate]);

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="xs"
      PaperProps={{ sx: { borderRadius: { xs: '0px', md: '16px' } } }}
      TransitionComponent={Slide}
      fullScreen={isMobile}
      sx={{ top: { xs: 'auto', md: 0 } }}
    >
      <IconButton
        aria-label="close"
        onClick={onClose}
        sx={{
          position: 'absolute',
          right: 16,
          top: 16,
          color: 'grey.500',
          zIndex: 1,
        }}
      >
        <CloseIcon sx={{ fontSize: 19 }} />
      </IconButton>
      <Box display="flex" flexDirection="column" gap={4} minWidth={350} minHeight={200} p={4}>
        <Typography variant="h6">{t('Votes Delegation')}</Typography>
        <Typography fontSize={14}>
          {t(
            'Enter the address of the third-party you wish to delegate your voting rights to below. You can also check the Delegates List and find someone to represent you.',
          )}
        </Typography>
        <TextField
          variant="outlined"
          fullWidth
          size="small"
          placeholder={t('Enter address') || ''}
          sx={{
            '& .MuiOutlinedInput-root': {
              p: 0.5,
              fontSize: 14,
              '&.Mui-focused fieldset': {
                border: '1px solid',
              },
            },
          }}
          disabled={isLoading}
          onChange={(e) => setInput(e.target.value)}
          onBlur={handleBlur}
        />
        <LoadingButton
          variant="contained"
          fullWidth
          loading={isLoading}
          disabled={!input || !isAddress(input) || input === walletAddress}
          onClick={handleDelegateClick}
        >
          {t('Delegate votes')}
        </LoadingButton>
      </Box>
    </Dialog>
  );
};

export default Delegation;
