import React, { ReactNode, useCallback, useMemo } from 'react';
import { Transaction } from 'types/Transaction';
import CheckIcon from '@mui/icons-material/Check';
import CloseIcon from '@mui/icons-material/Close';
import { Box, Button, CircularProgress, CircularProgressProps, Typography } from '@mui/material';
import { useOperationContext } from 'contexts/OperationContext';
import formatSymbol from 'utils/formatSymbol';
import Reminder from 'components/Reminder';
import parseTimestamp from 'utils/parseTimestamp';
import { useTranslation } from 'react-i18next';
import useTranslateOperation from 'hooks/useTranslateOperation';
import useEtherscanLink from 'hooks/useEtherscanLink';
import { track } from '../../../utils/segment';

type Props = {
  tx: Transaction;
  tryAgain?: () => void;
};

function ModalGif({ tx, tryAgain }: Props) {
  const { t } = useTranslation();
  const translateOperation = useTranslateOperation();
  const { operation, symbol, qty, date } = useOperationContext();

  const isLoading = useMemo(() => tx.status === 'processing' || tx.status === 'loading', [tx]);
  const isSuccess = useMemo(() => tx.status === 'success', [tx]);
  const isError = useMemo(() => tx.status === 'error', [tx]);
  const operationName = useMemo(
    () => translateOperation(operation, { variant: 'noun' }),
    [translateOperation, operation],
  );
  const reminder = useMemo(() => ['borrowAtMaturity', 'depositAtMaturity'].includes(operation), [operation]);

  const { tx: txLink } = useEtherscanLink();

  const handleTryAgainClick = useCallback(() => {
    track('Button Clicked', {
      location: 'Operations Modal',
      name: 'try again',
      status: tx.status,
    });
    tryAgain?.();
  }, [tryAgain, tx.status]);

  const trackViewOnEtherscan = useCallback(() => {
    track('Button Clicked', { location: 'Operations Modal', name: 'view on etherscan' });
  }, []);

  return (
    <Box display="flex" minWidth="340px" minHeight="240px">
      <Box display="flex" flexDirection="column" mx="auto" alignItems="center" py={{ xs: '30px', sm: '0' }} gap="32px">
        {isLoading && <CircularProgress size={100} thickness={1.5} />}
        {isSuccess && (
          <CircularProgressWithIcon
            sx={{ color: 'green' }}
            icon={<CheckIcon sx={{ color: 'green', fontSize: '42px' }} />}
          />
        )}
        {isError && (
          <CircularProgressWithIcon
            sx={{ color: 'red' }}
            icon={<CloseIcon sx={{ color: 'red', fontSize: '42px' }} />}
          />
        )}
        <Box display="flex" flexDirection="column" alignItems="center">
          <Typography variant="h6" fontSize="16px" data-testid="modal-transaction-status">
            {isLoading && t('Processing {{operation}}...', { operation: operationName })}
            {isSuccess && t('Transaction completed')}
            {isError && t('Transaction error')}
          </Typography>
          <Typography fontSize="14px" fontWeight={500} color="grey.500" data-testid="modal-transaction-summary">
            {isLoading &&
              `${translateOperation(operation, { variant: 'present', capitalize: true })} ${qty} ${formatSymbol(
                symbol,
              )}`}
            {isSuccess &&
              t('You {{pastAction}} {{qty}} {{symbol}}', {
                pastAction: translateOperation(operation, { variant: 'past' }),
                qty,
                symbol: formatSymbol(symbol),
              }) + (reminder && date ? t(' until {{daysLeft}}', { daysLeft: parseTimestamp(date) }) : '')}
            {isError && t('Something went wrong')}
          </Typography>
          <Box display="flex" flexDirection="column" alignItems="center" gap="8px" pt={1}>
            {isError && tryAgain && (
              <Button variant="contained" sx={{ width: '220px', height: '38px' }} onClick={handleTryAgainClick}>
                {t('Try again')}
              </Button>
            )}
            <Button
              component="a"
              variant="outlined"
              sx={{ width: '150px', height: '32px', fontWeight: 500, whiteSpace: 'nowrap' }}
              target="_blank"
              href={txLink(tx.hash ?? '0x')}
              onClick={trackViewOnEtherscan}
              disabled={!tx.hash}
            >
              {t('View on Etherscan')}
            </Button>
          </Box>
        </Box>
        {isSuccess && reminder && date !== undefined && <Reminder operation={operation} maturity={date} />}
      </Box>
    </Box>
  );
}

export function CircularProgressWithIcon(props: CircularProgressProps & { icon: ReactNode }) {
  return (
    <Box sx={{ position: 'relative', display: 'inline-flex' }}>
      <CircularProgress variant="determinate" value={100} size={100} thickness={1.5} {...props} />
      <Box
        top={0}
        left={0}
        bottom={0}
        right={0}
        position="absolute"
        display="flex"
        alignItems="center"
        justifyContent="center"
      >
        {props.icon}
      </Box>
    </Box>
  );
}

export default ModalGif;
