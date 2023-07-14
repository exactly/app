import React, { memo } from 'react';

import { useTranslation } from 'react-i18next';
import CheckIcon from '@mui/icons-material/Check';
import CloseIcon from '@mui/icons-material/Close';
import { Box, Button, CircularProgress, Typography } from '@mui/material';

import { CircularProgressWithIcon } from 'components/OperationsModal/ModalGif';
import { useGetEXA } from 'contexts/GetEXAContext';
import { Hash } from 'viem';

const SpinnerThing = ({
  status,
  hash,
  url,
}: {
  status: 'loading' | 'success' | 'error' | 'processing';
  hash?: Hash;
  url: string;
}) => {
  const { t } = useTranslation();
  const isLoading = status === 'processing' || status === 'loading';
  return (
    <Box
      display="flex"
      flexDirection="column"
      mx="auto"
      alignItems="center"
      py={{
        xs: '30px',
        sm: '0',
      }}
      gap="32px"
    >
      {isLoading && <CircularProgress size={100} thickness={1.5} />}
      {status === 'success' && (
        <CircularProgressWithIcon
          sx={{
            color: 'green',
          }}
          icon={
            <CheckIcon
              sx={{
                color: 'green',
                fontSize: '42px',
              }}
            />
          }
        />
      )}
      {status === 'error' && (
        <CircularProgressWithIcon
          sx={{
            color: 'red',
          }}
          icon={
            <CloseIcon
              sx={{
                color: 'red',
                fontSize: '42px',
              }}
            />
          }
        />
      )}
      <Box display="flex" flexDirection="column" alignItems="center">
        <Typography variant="h6" fontSize="16px" data-testid="modal-transaction-status">
          {isLoading && t('Transaction processing...')}
          {status === 'success' && t('Transaction Success')}
          {status === 'error' && t('Transaction Error')}
        </Typography>
        <Box display="flex" flexDirection="column" alignItems="center" gap="8px" pt={1}>
          <Button
            component="a"
            variant="outlined"
            sx={{
              width: '150px',
              height: '32px',
              fontWeight: 500,
              whiteSpace: 'nowrap',
            }}
            target="_blank"
            href={url}
            disabled={!hash}
          >
            {t('View TX')}
          </Button>
        </Box>
      </Box>
    </Box>
  );
};

const BridgeTXStatus = () => {
  const { bridgeStatus, isBridge, tx } = useGetEXA();
  const { sourceTxStatus, destinationTxStatus, sourceTransactionHash } = bridgeStatus || {
    sourceTxStatus: 'PENDING',
    destinationTxStatus: 'PENDING',
    sourceTransactionHash: tx?.hash,
  };
  const socketScanURL = `https://socketscan.io/tx/${sourceTransactionHash}`;
  const optimisticEtherscanURL = `https://optimistic.etherscan.io/tx/${sourceTransactionHash}`;
  const bridgeTXProps = {
    status:
      sourceTxStatus === 'PENDING' || destinationTxStatus === 'PENDING'
        ? 'loading'
        : sourceTxStatus === 'COMPLETED' && destinationTxStatus === 'COMPLETED'
        ? 'success'
        : 'error',
    hash: sourceTransactionHash,
    url: socketScanURL,
  } as const;
  const swapTXProps = { status: tx?.status || 'loading', hash: tx?.hash || '0x0', url: optimisticEtherscanURL };
  return (
    <Box display="flex" minWidth="340px" minHeight="240px" position="relative">
      <SpinnerThing {...(isBridge ? bridgeTXProps : swapTXProps)} />
    </Box>
  );
};

export default memo(BridgeTXStatus);
