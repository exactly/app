import React, { useCallback } from 'react';
import { useNetwork, useSwitchNetwork } from 'wagmi';
import { useTranslation } from 'react-i18next';
import { LoadingButton, type LoadingButtonProps } from '@mui/lab';
import { Button } from '@mui/material';

import { useWeb3 } from 'hooks/useWeb3';
import { useDebtManagerContext } from 'contexts/DebtManagerContext';

function Submit(props: LoadingButtonProps) {
  const { t } = useTranslation();
  const { isConnected, chain: displayNetwork, connect, impersonateActive, exitImpersonate } = useWeb3();
  const { chain } = useNetwork();
  const { switchNetwork, isLoading } = useSwitchNetwork();
  const { close } = useDebtManagerContext();

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

  if (chain && chain.id !== displayNetwork.id) {
    return (
      <LoadingButton
        fullWidth
        onClick={() => switchNetwork?.(displayNetwork.id)}
        variant="contained"
        loading={isLoading}
      >
        {t('Please switch to {{network}} network', { network: displayNetwork.name })}
      </LoadingButton>
    );
  }

  return <LoadingButton {...props} />;
}

export default React.memo(Submit);
