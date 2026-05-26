import React, { useCallback } from 'react';
import { useChainId, useConnection, useSwitchChain } from 'wagmi';
import { useTranslation } from 'react-i18next';
import { LoadingButton, type LoadingButtonProps } from '@mui/lab';
import { Button } from '@mui/material';

import { useModal } from 'contexts/ModalContext';
import { defaultChain } from 'utils/client';
import useReadOnly from 'hooks/useReadOnly';
import useConnectWallet from 'hooks/useConnectWallet';

function Submit(props: LoadingButtonProps) {
  const { t } = useTranslation();
  const { isImpersonating: impersonateActive, exitReadOnly: exitImpersonate } = useReadOnly();
  const { isConnected } = useConnection();
  const connect = useConnectWallet();
  const chainId = useChainId();
  const { mutate: switchChain, isPending } = useSwitchChain();
  const { close } = useModal('rollover');

  const exitAndClose = useCallback(() => {
    exitImpersonate();
    close();
  }, [close, exitImpersonate]);

  if (impersonateActive) {
    return (
      <Button fullWidth onClick={exitAndClose} variant="contained">
        {t('Exit Read-Only Mode')}
      </Button>
    );
  }

  if (!isConnected) {
    return (
      <Button fullWidth onClick={connect} variant="contained">
        {t('Connect wallet')}
      </Button>
    );
  }

  if (chainId !== defaultChain.id) {
    return (
      <LoadingButton
        fullWidth
        onClick={() => switchChain({ chainId: defaultChain.id })}
        variant="contained"
        loading={isPending}
      >
        {t('Please switch to {{network}} network', { network: defaultChain.name })}
      </LoadingButton>
    );
  }

  return <LoadingButton {...props} />;
}

export default React.memo(Submit);
