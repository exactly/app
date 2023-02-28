import React, { FC, MouseEventHandler } from 'react';
import { LoadingButton } from '@mui/lab';
import { capitalize, CircularProgress, Typography } from '@mui/material';
import { Box } from '@mui/system';
import { useOperationContext } from 'contexts/OperationContext';
import { useModalStatus } from 'contexts/ModalStatusContext';

type Props = {
  symbol: string;
  submit: MouseEventHandler;
  label: string;
  requiresApproval?: boolean;
  isLoading?: boolean;
  disabled?: boolean;
};

function ModalSubmit({ requiresApproval = false, isLoading = false, disabled = false, submit, symbol, label }: Props) {
  const { loadingButton, isLoading: isLoadingOp, tx } = useOperationContext();
  const { operation } = useModalStatus();

  return (
    <>
      {requiresApproval ? (
        <LoadingButton
          fullWidth
          loading={isLoading}
          loadingIndicator={
            <LoadingIndicator
              withCircularProgress={loadingButton.withCircularProgress || !loadingButton.label}
              label={loadingButton.label}
            />
          }
          onClick={submit}
          color="primary"
          variant="contained"
          disabled={disabled}
        >
          Approve {symbol}
        </LoadingButton>
      ) : (
        <LoadingButton
          fullWidth
          loading={isLoading}
          loadingIndicator={
            <LoadingIndicator
              withCircularProgress={!isLoadingOp || Boolean(tx)}
              label={
                (isLoadingOp && !tx && 'Sign the transaction on your wallet') ||
                ((isLoadingOp || Boolean(tx)) &&
                  `${capitalize(operation?.replaceAll('AtMaturity', ''))}ing ${symbol}`) ||
                ''
              }
            />
          }
          onClick={submit}
          color="primary"
          variant="contained"
          disabled={disabled || requiresApproval}
        >
          {label}
        </LoadingButton>
      )}
    </>
  );
}

type LoadingIndicatorProps = {
  withCircularProgress?: boolean;
  label?: string;
};

const LoadingIndicator: FC<LoadingIndicatorProps> = ({ withCircularProgress, label }) => {
  return (
    <Box display="flex" gap={0.5} alignItems="center" width="max-content">
      {withCircularProgress && <CircularProgress color="inherit" size={16} />}
      {label && (
        <Typography fontWeight={600} fontSize={14}>
          {label}
        </Typography>
      )}
    </Box>
  );
};

export default ModalSubmit;
