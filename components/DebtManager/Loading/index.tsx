import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Box, Button, CircularProgress, Typography } from '@mui/material';
import CheckIcon from '@mui/icons-material/Check';
import CloseIcon from '@mui/icons-material/Close';

import { Transaction } from 'types/Transaction';
import { Position } from '../types';
import useEtherscanLink from 'hooks/useEtherscanLink';
import { CircularProgressWithIcon } from 'components/OperationsModal/ModalGif';
import Reminder from 'components/Reminder';

type Props = {
  tx: Transaction;
  to: Position;
};

function Loading({ tx, to }: Props) {
  const { t } = useTranslation();

  const isLoading = useMemo(() => tx.status === 'processing' || tx.status === 'loading', [tx]);
  const isSuccess = useMemo(() => tx.status === 'success', [tx]);
  const isError = useMemo(() => tx.status === 'error', [tx]);
  const { tx: txLink } = useEtherscanLink();

  return (
    <Box display="flex" minWidth="340px">
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
          <Typography variant="h6" fontSize="16px">
            {isLoading && t('Processing rollover...')}
            {isSuccess && t('Transaction completed')}
            {isError && t('Transaction error')}
          </Typography>
          <Typography fontSize="14px" fontWeight={500} color="grey.500">
            {isLoading && t('You are refinancing your position')}
            {isSuccess && t('Your position has been refinanced')}
            {isError && t('Something went wrong')}
          </Typography>
          <Box display="flex" flexDirection="column" alignItems="center" gap="8px" pt={1}>
            {tx.hash && (
              <Button
                component="a"
                variant="outlined"
                sx={{ width: '150px', height: '32px', fontWeight: 500, whiteSpace: 'nowrap' }}
                target="_blank"
                href={txLink(tx.hash)}
              >
                {t('View on Etherscan')}
              </Button>
            )}
          </Box>
        </Box>
        {isSuccess && Boolean(to.maturity) && <Reminder operation="borrowAtMaturity" maturity={to.maturity ?? 0n} />}
      </Box>
    </Box>
  );
}

export default React.memo(Loading);
