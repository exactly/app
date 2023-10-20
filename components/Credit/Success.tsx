import React from 'react';
import Link from 'next/link';
import { useTranslation } from 'react-i18next';
import CheckIcon from '@mui/icons-material/Check';
import { Box, Button, Typography } from '@mui/material';
import { CircularProgressWithIcon } from '../OperationsModal/ModalGif';
import { useOperationContext } from '../../contexts/OperationContext';
import useEtherscanLink from '../../hooks/useEtherscanLink';
import Reminder from '../Reminder';
import type { App } from '.';

type Props = {
  app: App;
};

const Success = ({ app }: Props) => {
  const { tx: txLink } = useEtherscanLink();
  const { t } = useTranslation();
  const { date, tx } = useOperationContext();
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
      <CircularProgressWithIcon
        sx={{ color: 'green' }}
        icon={<CheckIcon sx={{ color: 'green', fontSize: '42px' }} />}
      />
      <Typography fontSize={16} fontWeight={700} mt={5}>
        {t('Transaction Completed')}
      </Typography>
      <Typography fontSize={16} fontWeight={500} mb={5} textAlign="center" color="grey.500">
        {app.finishInstructions}
      </Typography>
      <Box display="flex" flexDirection="column" gap={1}>
        <Link href={app.link} target="_blank" rel="noopener noreferrer" style={{ width: '100%' }}>
          <Button variant="contained" fullWidth>
            {t('Open')} {app.name}
          </Button>
        </Link>
        {tx?.hash && (
          <Button
            component="a"
            variant="outlined"
            sx={{ height: '32px', fontWeight: 500, whiteSpace: 'nowrap' }}
            target="_blank"
            href={txLink(tx.hash ?? '0x')}
            fullWidth
          >
            {t('View on Etherscan')}
          </Button>
        )}
        {date !== undefined && <Reminder maturity={date} operation="borrowAtMaturity" />}
      </Box>
    </Box>
  );
};

export default Success;
