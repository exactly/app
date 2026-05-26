import React, { MouseEvent, useCallback } from 'react';
import { useChainId, useConnection, useSwitchChain } from 'wagmi';
import { useTranslation } from 'react-i18next';
import { LoadingButton, type LoadingButtonProps } from '@mui/lab';
import { Button } from '@mui/material';

import { useModal } from 'contexts/ModalContext';
import { defaultChain } from 'utils/client';
import useReadOnly from 'hooks/useReadOnly';
import useConnectWallet from 'hooks/useConnectWallet';

function MainActionButton({ onClick, ...props }: LoadingButtonProps) {
  const { t } = useTranslation();
  const { isImpersonating: impersonateActive, exitReadOnly: exitImpersonate } = useReadOnly();
  const { isConnected } = useConnection();
  const connect = useConnectWallet();
  const chainId = useChainId();
  const { mutateAsync: switchChainAsync, isPending } = useSwitchChain();
  const { close } = useModal('rollover');

  const exitAndClose = useCallback(() => {
    exitImpersonate();
    close();
  }, [close, exitImpersonate]);

  const handleClick = useCallback(
    async (event: MouseEvent<HTMLButtonElement>) => {
      if (chainId !== defaultChain.id) {
        try {
          const result = await switchChainAsync({ chainId: defaultChain.id });

          if (result.id === defaultChain.id && onClick && event) {
            onClick(event);
          }
        } catch (error) {
          return;
        }
      } else if (onClick && event) {
        onClick(event);
      }
    },
    [chainId, switchChainAsync, onClick],
  );

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

  return <LoadingButton {...props} loading={isPending || props.loading} onClick={handleClick} />;
}

export default React.memo(MainActionButton);
