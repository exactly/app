import React, { MouseEventHandler } from 'react';
import { LoadingButton } from '@mui/lab';

type Props = {
  symbol: string;
  submit: MouseEventHandler;
  label: string;
  requiresApproval?: boolean;
  isLoading?: boolean;
  disabled?: boolean;
};

function ModalSubmit({ requiresApproval = false, isLoading = false, disabled = false, submit, symbol, label }: Props) {
  return (
    <>
      {requiresApproval && (
        <LoadingButton
          fullWidth
          loading={isLoading}
          onClick={submit}
          color="primary"
          variant="contained"
          disabled={disabled}
          sx={{ mb: 1 }}
          data-test-id="modal-approve"
        >
          Approve {symbol}
        </LoadingButton>
      )}
      <LoadingButton
        fullWidth
        loading={isLoading}
        onClick={submit}
        color="primary"
        variant="contained"
        disabled={disabled || requiresApproval}
        data-test-id="modal-submit"
      >
        {label}
      </LoadingButton>
    </>
  );
}

export default React.memo(ModalSubmit);
