import React, { FC, MouseEvent, useCallback } from 'react';
import { LoadingButton } from '@mui/lab';
import { Button, CircularProgress, Typography } from '@mui/material';
import { Box } from '@mui/system';
import { useOperationContext } from 'contexts/OperationContext';
import { useWeb3 } from 'hooks/useWeb3';
import { useTranslation } from 'react-i18next';
import useTranslateOperation from 'hooks/useTranslateOperation';
import useAccountData from 'hooks/useAccountData';
import { track } from 'utils/mixpanel';
import MainActionButton from 'components/common/MainActionButton';

type Props = {
  symbol: string;
  submit: () => Promise<void>;
  label: string;
  isLoading?: boolean;
  disabled?: boolean;
};

function ModalSubmit({ isLoading = false, disabled = false, submit, symbol, label }: Props) {
  const { t } = useTranslation();
  const translateOperation = useTranslateOperation();
  const { operation, loadingButton, isLoading: isLoadingOp, tx, errorButton, requiresApproval } = useOperationContext();
  const { isConnected, connect, impersonateActive, exitImpersonate } = useWeb3();
  const { refreshAccountData } = useAccountData();

  const handleSubmit = useCallback(async () => {
    await submit();
    if (!requiresApproval) {
      await refreshAccountData();
    }
  }, [submit, refreshAccountData, requiresApproval]);

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

  const handleApproveClick = useCallback(
    (event: MouseEvent<HTMLButtonElement>) => {
      track('Button Clicked', {
        location: 'Operations Modal',
        name: 'approve',
        symbol,
        text: event.currentTarget.innerText,
      });
      handleSubmit();
    },
    [handleSubmit, symbol],
  );

  const handleSubmitClick = useCallback(
    (event: MouseEvent<HTMLButtonElement>) => {
      track('Button Clicked', {
        location: 'Operations Modal',
        name: 'submit',
        symbol,
        text: event.currentTarget.innerText,
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

  if (requiresApproval) {
    return (
      <MainActionButton
        fullWidth
        loading={isLoading}
        loadingIndicator={
          <LoadingIndicator
            withCircularProgress={loadingButton.withCircularProgress || !loadingButton.label}
            label={loadingButton.label}
          />
        }
        mainAction={handleApproveClick}
        color="primary"
        variant="contained"
        disabled={disabled}
        data-testid="modal-approve"
      >
        {t('Approve {{symbol}}', { symbol })}
      </MainActionButton>
    );
  }

  return (
    <LoadingButton
      fullWidth
      loading={isLoading}
      loadingIndicator={
        <LoadingIndicator
          withCircularProgress={!isLoadingOp || Boolean(tx)}
          label={
            (isLoadingOp && !tx && t('Sign the transaction on your wallet')) ||
            ((isLoadingOp || Boolean(tx)) &&
              `${translateOperation(operation, { variant: 'present', capitalize: true })} ${symbol}`) ||
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
    </LoadingButton>
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
