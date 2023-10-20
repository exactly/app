import React, { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, Box, CircularProgress, Step, StepLabel, Stepper } from '@mui/material';
import { TXStep, useSocketSwap } from '../../contexts/SocketSwapContext';
import { CircularProgressWithIcon } from '../OperationsModal/ModalGif';
import CloseIcon from '@mui/icons-material/Close';

type Props = {
  onNextStep: () => void;
};

const Swap = ({ onNextStep }: Props) => {
  const { submit, approve, txStep, setTXStep, txError, tx } = useSocketSwap();
  const { t } = useTranslation();

  useEffect(() => {
    approve();
  }, [approve]);

  useEffect(() => {
    if (txStep !== TXStep.CONFIRM) return;
    submit();
  }, [submit, txStep]);

  useEffect(() => {
    if (tx && tx.status === 'success') {
      onNextStep();
    }
  }, [onNextStep, tx]);

  const operations = [
    {
      success: t('Borrow successful'),
    },
    {
      loading: t('Approve assets in your wallet'),
      success: t('Approved assets'),
    },
    {
      loading: t('Sign Swap transaction in your wallet'),
      success: t('Transaction signed'),
    },
    {
      loading: t('Swap in progress'),
      success: t('Swap successful'),
    },
  ];
  const currentOperation = txStep === TXStep.APPROVE || txStep === TXStep.APPROVE_PENDING ? 1 : tx ? 3 : 2;

  return (
    <Box
      sx={({ palette }) => ({
        p: 3,
        bgcolor: 'components.bg',
        borderRadius: 2,
        boxShadow: palette.mode === 'light' ? '0px 4px 12px rgba(175, 177, 182, 0.2)' : '',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
      })}
    >
      {txError ? (
        <CircularProgressWithIcon sx={{ color: 'red' }} icon={<CloseIcon sx={{ color: 'red', fontSize: '42px' }} />} />
      ) : (
        <CircularProgress size={100} thickness={1.5} sx={{ mb: 4 }} />
      )}
      {txError ? (
        <Alert severity="error" sx={{ mt: 3 }}>
          {txError.message}{' '}
          <button
            onClick={() => setTXStep(TXStep.APPROVE)}
            style={{
              fontWeight: 700,
              textDecoration: 'underline',
              cursor: 'pointer',
              padding: 'unset',
              background: 'unset',
              border: 'unset',
              fontSize: 'unset',
              color: 'unset',
            }}
          >
            {t('Retry')}
          </button>
        </Alert>
      ) : (
        <Stepper
          activeStep={currentOperation}
          orientation="vertical"
          sx={{
            '& .MuiStepConnector-line': {
              display: 'none',
            },
            alignItems: 'center',
          }}
        >
          {operations.map(({ success, loading }, operation) => (
            <Step
              key={success}
              sx={{
                '& .MuiStepLabel-label': {
                  fontWeight: 700,
                  fontSize: 16,
                },
                '& .MuiStepIcon-root': {
                  color: '#33CC59',
                  display: currentOperation > operation ? 'block' : 'none',
                  fontSize: 14,
                },
                '& .Mui-completed': {
                  color: '#33CC59',
                },
                '& .Mui-disabled': {
                  color: '#B4BABF',
                },
              }}
            >
              <StepLabel>{currentOperation > operation ? success : loading}</StepLabel>
            </Step>
          ))}
        </Stepper>
      )}
    </Box>
  );
};

export default Swap;
