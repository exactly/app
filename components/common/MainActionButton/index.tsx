import React, { useCallback } from 'react';
import { useNetwork, useSwitchNetwork } from 'wagmi';
import { useTranslation } from 'react-i18next';
import { LoadingButton, type LoadingButtonProps } from '@mui/lab';
import { Button } from '@mui/material';

import { useWeb3 } from 'hooks/useWeb3';
import { useModal } from 'contexts/ModalContext';

interface MainActionButtonProps extends LoadingButtonProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onClick?: (event?: any) => void;
}

function MainActionButton({ onClick, ...props }: MainActionButtonProps) {
  const { t } = useTranslation();
  const { isConnected, chain: displayNetwork, connect, impersonateActive, exitImpersonate } = useWeb3();
  const { chain } = useNetwork();
  const { switchNetworkAsync, isLoading } = useSwitchNetwork();
  const { close } = useModal('rollover');

  const exitAndClose = useCallback(() => {
    exitImpersonate();
    close();
  }, [close, exitImpersonate]);

  const handleSwitchNetworkAndExecuteMainAction = useCallback(
    async (event?: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
      if (chain && chain.id !== displayNetwork.id && switchNetworkAsync) {
        try {
          const result = await switchNetworkAsync(displayNetwork.id);

          if (result.id === displayNetwork.id && onClick && event) {
            onClick(event);
          }
        } catch (error) {
          return;
        }
      } else if (onClick && event) {
        onClick(event);
      }
    },
    [chain, displayNetwork.id, switchNetworkAsync, onClick],
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

  return <LoadingButton {...props} loading={isLoading} onClick={handleSwitchNetworkAndExecuteMainAction} />;
}

export default React.memo(MainActionButton);
