import React, { FC, useCallback } from 'react';
import { LoadingButton } from '@mui/lab';
import { Button, CircularProgress, Typography } from '@mui/material';
import { Box } from '@mui/system';
import { useOperationContext } from 'contexts/OperationContext';
import { useModalStatus } from 'contexts/ModalStatusContext';
import { useNetwork, useSwitchNetwork } from 'wagmi';
import { useWeb3 } from 'hooks/useWeb3';
import { useTranslation } from 'react-i18next';
import useTranslateOperation from 'hooks/useTranslateOperation';
import useAccountData from 'hooks/useAccountData';

type Props = {
  symbol: string;
  submit: () => Promise<void>;
  label: string | null;
  isLoading?: boolean;
  disabled?: boolean;
};

function ModalSubmit({ isLoading = false, disabled = false, submit, symbol, label }: Props) {
  const { t } = useTranslation();
  const translateOperation = useTranslateOperation();
  const { loadingButton, isLoading: isLoadingOp, tx, errorButton, requiresApproval } = useOperationContext();
  const { operation } = useModalStatus();
  const { isConnected, chain: displayNetwork, connect } = useWeb3();
  const { chain } = useNetwork();
  const { switchNetwork, isLoading: switchIsLoading } = useSwitchNetwork();
  const { refreshAccountData } = useAccountData();

  const handleSubmit = useCallback(async () => {
    await submit();
    if (!requiresApproval) {
      await refreshAccountData();
    }
  }, [submit, refreshAccountData, requiresApproval]);

  if (!isConnected) {
    return (
      <Button fullWidth onClick={connect} variant="contained" data-testid="modal-connect-wallet">
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
        loading={switchIsLoading}
        data-testid="modal-switch-network"
      >
        {t('Please switch to {{network}} network', { network: displayNetwork.name })}
      </LoadingButton>
    );
  }

  if (requiresApproval) {
    return (
      <LoadingButton
        fullWidth
        loading={isLoading}
        loadingIndicator={
          <LoadingIndicator
            withCircularProgress={loadingButton.withCircularProgress || !loadingButton.label}
            label={loadingButton.label}
          />
        }
        onClick={handleSubmit}
        color="primary"
        variant="contained"
        disabled={disabled}
        data-testid="modal-approve"
      >
        {t('Approve {{symbol}}', { symbol })}
      </LoadingButton>
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
      onClick={handleSubmit}
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
  label?: string | null;
};

const LoadingIndicator: FC<LoadingIndicatorProps> = ({ withCircularProgress, label }) => {
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
