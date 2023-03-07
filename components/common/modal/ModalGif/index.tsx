import React, { ReactNode, useContext, useMemo } from 'react';
import { Transaction } from 'types/Transaction';
import CheckIcon from '@mui/icons-material/Check';
import CloseIcon from '@mui/icons-material/Close';
import { Box, Button, capitalize, CircularProgress, CircularProgressProps, Typography } from '@mui/material';
import networkData from 'config/networkData.json' assert { type: 'json' };
import { useWeb3 } from 'hooks/useWeb3';
import { useModalStatus } from 'contexts/ModalStatusContext';
import pastParticiple from 'utils/pastParticiple';
import { useOperationContext } from 'contexts/OperationContext';
import formatSymbol from 'utils/formatSymbol';
import Reminder from 'components/Reminder';
import { MarketContext } from 'contexts/MarketContext';
import parseTimestamp from 'utils/parseTimestamp';

type Props = {
  tx: Transaction;
  tryAgain: () => void;
};

function ModalGif({ tx, tryAgain }: Props) {
  const { chain } = useWeb3();
  const { operation } = useModalStatus();
  const { symbol, qty } = useOperationContext();
  const { date } = useContext(MarketContext);

  const isLoading = useMemo(() => tx.status === 'processing' || tx.status === 'loading', [tx]);
  const isSuccess = useMemo(() => tx.status === 'success', [tx]);
  const isError = useMemo(() => tx.status === 'error', [tx]);
  const etherscan = useMemo(() => networkData[String(chain?.id) as keyof typeof networkData]?.etherscan, [chain]);
  const operationName = useMemo(() => operation?.replaceAll('AtMaturity', ''), [operation]);
  const withMaturity = useMemo(() => operation?.includes('AtMaturity'), [operation]);

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
            {isLoading && `Processing ${operationName}...`}
            {isSuccess && 'Transaction completed'}
            {isError && 'Transaction error'}
          </Typography>
          <Typography fontSize="14px" fontWeight={500} color="grey.500" data-testid="modal-transaction-summary">
            {isLoading && `${capitalize(operationName)}ing ${qty} ${formatSymbol(symbol)}`}
            {isSuccess &&
              `You ${pastParticiple(operationName)} ${qty} ${formatSymbol(symbol)}${
                withMaturity && date ? ` until ${parseTimestamp(date)}` : ''
              }`}
            {isError && 'Something went wrong'}
          </Typography>
          <Box display="flex" flexDirection="column" alignItems="center" gap="8px" pt={1}>
            {isError && (
              <Button variant="contained" sx={{ width: '220px', height: '38px' }} onClick={tryAgain}>
                Try again
              </Button>
            )}
            <Button
              variant="outlined"
              sx={{ width: '150px', height: '32px', fontWeight: 500, whiteSpace: 'nowrap' }}
              target="_blank"
              href={`${etherscan}/tx/${tx.hash}`}
              disabled={!tx.hash}
            >
              View on Etherscan
            </Button>
          </Box>
        </Box>
        {isSuccess && withMaturity && date && <Reminder operationName={operationName} maturity={date} />}
      </Box>
    </Box>
  );
}

function CircularProgressWithIcon(props: CircularProgressProps & { icon: ReactNode }) {
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
