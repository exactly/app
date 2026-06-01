import React, { FC, MouseEvent, useCallback } from 'react';
import { Box, Button, CircularProgress, Typography } from '@mui/material';
import { useOperationContext } from 'contexts/OperationContext';
import { useTranslation } from 'react-i18next';
import useTranslateOperation from 'hooks/useTranslateOperation';
import usePreviewerExactly from 'hooks/usePreviewerExactly';
import { track } from 'utils/mixpanel';
import MainActionButton from 'components/common/MainActionButton';
import useReadOnly from 'hooks/useReadOnly';
import { useConnection } from 'wagmi';
import useConnectWallet from 'hooks/useConnectWallet';

type Props = {
  symbol: string;
  submit: () => Promise<void>;
  label: string;
  isLoading?: boolean;
  disabled?: boolean;
  refreshOnSubmit?: boolean;
};

function ModalSubmit({ isLoading = false, disabled = false, refreshOnSubmit = true, submit, symbol, label }: Props) {
  const { t } = useTranslation();
  const translateOperation = useTranslateOperation();
  const { operation, isLoading: isLoadingOp, errorButton } = useOperationContext();
  const { isImpersonating: impersonateActive, exitReadOnly: exitImpersonate } = useReadOnly();
  const { isConnected } = useConnection();
  const connect = useConnectWallet();
  const { refetch } = usePreviewerExactly();

  const handleSubmit = useCallback(async () => {
    await submit();
    if (refreshOnSubmit) {
      await refetch();
    }
  }, [submit, refetch, refreshOnSubmit]);

  const handleExitImpersonate = useCallback(() => {
    track('Button Clicked', {
      location: 'Operations Modal',
      name: 'exit impersonate',
    });
    exitImpersonate();
  }, [exitImpersonate]);

  const handleConnect = useCallback(() => {
    track('Button Clicked', {
      location: 'Operations Modal',
      name: 'connect',
    });
    connect();
  }, [connect]);

  const handleSubmitClick = useCallback(
    (event: MouseEvent<HTMLButtonElement>) => {
      const text = (event.target as HTMLButtonElement).innerText;
      track('Button Clicked', {
        location: 'Operations Modal',
        name: 'submit',
        symbol,
        text,
      });
      handleSubmit();
    },
    [handleSubmit, symbol],
  );

  if (impersonateActive) {
    return (
      <Button fullWidth onClick={handleExitImpersonate} variant="contained" data-testid="modal-exit-impersonate">
        {t('Exit Read-Only Mode')}
      </Button>
    );
  }

  if (!isConnected) {
    return (
      <Button fullWidth onClick={handleConnect} variant="contained" data-testid="modal-connect-wallet">
        {t('Connect wallet')}
      </Button>
    );
  }

  return (
    <MainActionButton
      fullWidth
      loading={isLoading}
      loadingIndicator={
        <LoadingIndicator
          withCircularProgress={!isLoadingOp}
          label={
            (isLoadingOp && t('Sign the transaction on your wallet')) ||
            (isLoading && `${translateOperation(operation, { variant: 'present', capitalize: true })} ${symbol}`) ||
            ''
          }
        />
      }
      onClick={handleSubmitClick}
      color="primary"
      variant="contained"
      disabled={disabled || Boolean(errorButton)}
      data-testid="modal-submit"
    >
      {errorButton ? errorButton : label}
    </MainActionButton>
  );
}

type LoadingIndicatorProps = {
  withCircularProgress?: boolean;
  label?: string;
};

export const LoadingIndicator: FC<LoadingIndicatorProps> = ({ withCircularProgress, label }) => {
  return (
    <Box display="flex" gap={0.5} alignItems="center" width="max-content">
      {withCircularProgress && <CircularProgress color="inherit" size={16} />}
      {label && (
        <Typography fontWeight={600} fontSize={13}>
          {label}
        </Typography>
      )}
    </Box>
  );
};

export default ModalSubmit;
