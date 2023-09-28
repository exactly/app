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

import { Trans, useTranslation } from 'react-i18next';
import { LoadingButton } from '@mui/lab';
import { isAddress, zeroAddress } from 'viem';
import { formatWallet } from 'utils/utils';
import { useWeb3 } from 'hooks/useWeb3';
import { useDelegateRegistryClearDelegate, useDelegateRegistrySetDelegate } from 'types/abi';
import { mainnet, useEnsAvatar, useEnsName, useNetwork, useSwitchNetwork, useWaitForTransaction } from 'wagmi';
import * as blockies from 'blockies-ts';
import { useDelegation, usePrepareClearDelegate, usePrepareDelegate } from 'hooks/useDelegateRegistry';
import formatNumber from 'utils/formatNumber';
import useGovernance from 'hooks/useGovernance';

type Props = {
  fetchVotingPower: () => void;
};

const Delegation: FC<Props> = ({ fetchVotingPower }) => {
  const { votingPower } = useGovernance(false);
  const { t } = useTranslation();
  const { chain: displayNetwork, walletAddress, impersonateActive, exitImpersonate } = useWeb3();
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

  const { chain } = useNetwork();
  const { switchNetwork, isLoading: switchIsLoading } = useSwitchNetwork();

  const delegateAvatar = useMemo(() => {
    if (!delegate) return '';
    if (delegateENSAvatar && !ensAvatarError) return delegateENSAvatar;
    return blockies
      .create({ seed: (delegate === zeroAddress ? walletAddress : delegate)?.toLocaleLowerCase() })
      .toDataURL();
  }, [delegate, delegateENSAvatar, ensAvatarError, walletAddress]);

  const openDialog = useCallback(() => {
    setOpen(true);
  }, []);

  const closeDialog = useCallback(() => {
    setOpen(false);
  }, []);

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
      <Divider flexItem />
      <DelegateInputDialog
        open={open}
        onClose={closeDialog}
        input={input}
        setInput={setInput}
        onDelegate={write}
        isLoading={submitLoading || waitingDelegate}
      />
      <Box display="flex" flexDirection="column" gap={3}>
        <Typography variant="h6">{t('Votes Delegation')}</Typography>
        {votingPower !== undefined ? (
          <Typography fontSize={14}>
            {delegate !== zeroAddress ? (
              <Trans
                i18nKey="Your total of <1>{{amount}} voting power</1> is currently delegated to the following address:"
                components={{
                  1: <strong></strong>,
                }}
                values={{ amount: formatNumber(votingPower, 'USD', true) }}
              />
            ) : (
              <Trans
                i18nKey="Your total of <1>{{amount}} voting power</1> is currently assigned to the following address:"
                components={{
                  1: <strong></strong>,
                }}
                values={{ amount: formatNumber(votingPower, 'USD', true) }}
              />
            )}
          </Typography>
        ) : (
          <Skeleton height={30} />
        )}
      </Box>
      <Box display="flex" gap={1}>
        <Avatar alt="Delegate avatar" src={delegateAvatar} sx={{ width: 24, height: 24 }} />
        <Typography fontSize={16} fontFamily="IBM Plex Mono">
          {delegateENS ? delegateENS : formatWallet(delegate === zeroAddress ? walletAddress : delegate)}
        </Typography>
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
      ) : (
        <Box display="flex" gap={1}>
          <LoadingButton variant="contained" fullWidth onClick={openDialog} loading={submitLoading || waitingDelegate}>
            {t('Delegate Votes')}
          </LoadingButton>
          {delegate !== zeroAddress && (
            <LoadingButton
              fullWidth
              variant="outlined"
              onClick={writeClearDelegate}
              loading={clearDelegateLoading || waitingClearDelegate || waitingDelegate}
            >
              {t('Revoke delegation')}
            </LoadingButton>
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

  return (
    <Dialog
      open={open}
      onClose={onClose}
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
        />
        <LoadingButton
          variant="contained"
          fullWidth
          loading={isLoading}
          disabled={!input || !isAddress(input) || input === walletAddress}
          onClick={onDelegate}
        >
          {t('Delegate Votes')}
        </LoadingButton>
      </Box>
    </Dialog>
  );
};

export default React.memo(Delegation);
