import React, { PropsWithChildren, useState } from 'react';
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  capitalize,
  Skeleton,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMoreRounded';
import { useTranslation } from 'react-i18next';

import { type SafeResponse, type Transaction, useTransaction } from '../api';
import Decode from '../Decode';

import { formatTx, formatWallet } from 'utils/utils';
import parseTimestamp from 'utils/parseTimestamp';
import useEtherscanLink from 'hooks/useEtherscanLink';
import Link from 'next/link';
import Pill from 'components/common/Pill';

type Props = {
  title: string;
  empty: string;
  isLoading: boolean;
  data?: SafeResponse;
};

export default function Events({ title, empty, data, isLoading }: Props) {
  return (
    <Box>
      <Typography
        variant="h2"
        fontSize={24}
        fontWeight={700}
        color={({ palette }) => (palette.mode === 'dark' ? 'white' : 'black')}
      >
        {title}
      </Typography>
      <Box mt={6}>
        {isLoading || data === undefined ? (
          <>
            <Skeleton variant="rectangular" height={48} sx={{ borderRadius: 2 }} />
          </>
        ) : data.count === 0 ? (
          <Typography textAlign="center" color="grey.400">
            {empty}
          </Typography>
        ) : (
          data.results.flatMap((tx) =>
            tx.type === 'TRANSACTION' ? [<Event key={tx.transaction.id} tx={tx.transaction} />] : [],
          )
        )}
      </Box>
    </Box>
  );
}

type EventProps = {
  tx: Transaction;
};

function Event({ tx }: EventProps) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const actions = tx.txInfo.actionCount ?? 1;

  const method = (methodName: string | null) => {
    if (methodName === 'multiSend') {
      return t('Multiple transactions');
    }

    if (methodName === 'execute') {
      return t('Execution');
    }

    if (methodName === 'schedule') {
      return t('Schedule');
    }

    return t('Unknown');
  };

  return (
    <Accordion
      disableGutters
      sx={{
        '&:before': { backgroundColor: 'transparent' },
        '&:first-of-type': { borderTopLeftRadius: '8px', borderTopRightRadius: '8px' },
        '&:last-of-type': { borderBottomLeftRadius: '8px', borderBottomRightRadius: '8px', borderBottom: 0 },
        bgcolor: ({ palette }) => (palette.mode === 'dark' ? 'grey.100' : 'white'),
        borderBottom: '1px solid',
        borderColor: 'grey.300',
      }}
      onChange={() => setOpen(true)}
    >
      <AccordionSummary
        sx={{
          '&:hover': { backgroundColor: ({ palette }) => (palette.mode === 'dark' ? '#ffffff0b' : '#F0F1F2') },
          height: 90,
          p: 3,
          '& .MuiAccordionSummary-content': { m: 0, mr: 3, justifyContent: 'space-between' },
        }}
        expandIcon={<ExpandMoreIcon sx={{ fontSize: 16, color: 'grey.900' }} />}
        aria-controls={`${tx.id}_content`}
        id={`${tx.id}_header`}
      >
        <Box>
          <Box display="flex" alignItems="center" gap={0.5} color="grey.900">
            <Typography component="span" fontSize={14} fontWeight={500} fontFamily="fontFamilyMonospaced">
              {String(tx.executionInfo.nonce).padStart(2, '0')}
            </Typography>
            <Typography component="span" fontSize={14} fontWeight={500} fontFamily="fontFamilyMonospaced">
              •
            </Typography>
            <Typography component="span" variant="h6">
              {tx.txInfo.type === 'SettingsChange' ? 'Safe' : 'Protocol'}:
            </Typography>
            <Typography
              component="span"
              variant="h6"
              fontWeight={500}
              sx={{
                xs: { maxWidth: 160, whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflowX: 'hidden' },
                sm: {},
              }}
            >
              {tx.txInfo.type === 'SettingsChange' && tx.txInfo.humanDescription
                ? tx.txInfo.humanDescription
                : capitalize(method(tx.txInfo.methodName))}
            </Typography>
          </Box>
          <Box display="flex" alignItems="center" gap={0.5}>
            <Typography component="span" fontSize={14} textTransform="uppercase" fontWeight={500} color="grey.400">
              {t('Approved by')}:
            </Typography>
            <Typography component="span" fontSize={14} fontWeight={700} color="grey.700">
              {tx.executionInfo.confirmationsSubmitted}/{tx.executionInfo.confirmationsRequired}
            </Typography>
          </Box>
        </Box>
        <Box display="flex" flexDirection="column" alignItems="flex-end">
          <Typography component="div" variant="h6" textAlign="right" mb={0.2} whiteSpace="nowrap">
            {actions} {actions === 1 ? t('Action') : t('Actions')}
          </Typography>
          {tx.txStatus === 'SUCCESS' && <Pill text={t('Executed')} />}
        </Box>
      </AccordionSummary>
      <AccordionDetails sx={{ p: 0 }}>{open && <EventSummary tx={tx} />}</AccordionDetails>
    </Accordion>
  );
}

type TitleProps = PropsWithChildren<{
  title: React.ReactNode;
}>;

function Row({ title, children }: TitleProps) {
  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'flex-start',
        flexDirection: { xs: 'column', sm: 'row' },
        p: 3,
        borderTop: '1px solid',
        borderColor: 'grey.300',
        gap: 2,
      }}
    >
      <Typography
        pt="1px"
        color="grey.400"
        fontSize={12}
        fontWeight={500}
        fontFamily="fontFamilyMonospaced"
        minWidth={136}
      >
        {title}
      </Typography>
      {children}
    </Box>
  );
}

function Value({ children }: PropsWithChildren) {
  return (
    <Typography fontSize={14} fontWeight={500} color="grey.900" sx={{ '&:not(:last-of-type)': { mb: 1 } }}>
      {children}
    </Typography>
  );
}

function Skel() {
  return (
    <Box sx={{ p: 3 }}>
      {Array.from({ length: 3 }).map((_, i) => (
        <Box key={i} display="flex" alignItems="center" gap={2} sx={{ '&:not(:last-of-type)': { mb: 3 } }}>
          <Skeleton variant="text" height={20} sx={{ minWidth: 136 }} />
          <Skeleton variant="text" height={20} sx={{ flexGrow: 1 }} />
        </Box>
      ))}
    </Box>
  );
}

function EventSummary({ tx }: EventProps) {
  const { t } = useTranslation();
  const { data, isLoading } = useTransaction(tx.id);

  const { breakpoints } = useTheme();
  const isMobile = useMediaQuery(breakpoints.down('sm'));

  const { tx: transaction, address } = useEtherscanLink();

  if (isLoading || !data) {
    return <Skel />;
  }

  const isMultiSend =
    tx.txInfo.actionCount !== null &&
    data.txData.dataDecoded &&
    data.txData.dataDecoded.method === 'multiSend' &&
    data.txData.dataDecoded.parameters.length === 1 &&
    !!data.txData.dataDecoded.parameters[0].valueDecoded;

  const format = (value: string) => {
    return isMobile ? formatWallet(value) : value;
  };

  return (
    <Box display="flex" flexDirection="column">
      <Row title={t('Transaction Hash')}>
        <Value>
          <Link href={transaction(data.txHash)} target="_blank" rel="noopener noreferrer">
            {formatTx(data.txHash)}
          </Link>
        </Value>
      </Row>
      <Row title={t('Submited At')}>
        <Value>{parseTimestamp(data.detailedExecutionInfo.submittedAt / 1000, 'YYYY-MM-DD HH:mm:ss')}</Value>
      </Row>
      {data.executedAt && (
        <Row title={t('Executed At')}>
          <Value>{parseTimestamp(data.executedAt / 1000, 'YYYY-MM-DD HH:mm:ss')}</Value>
        </Row>
      )}
      <Row title={t('Signers')}>
        <Box>
          {data.detailedExecutionInfo.confirmations.map((confirmation) => (
            <Value key={confirmation.signature}>
              <Link href={address(confirmation.signer.value)} target="_blank" rel="noopener noreferrer">
                {format(confirmation.signer.value)}
              </Link>
            </Value>
          ))}
        </Box>
      </Row>
      <Row title={t('Executor')}>
        <Value>
          <Link href={data.detailedExecutionInfo.executor.value} target="_blank" rel="noopener noreferrer">
            {format(data.detailedExecutionInfo.executor.value)}
          </Link>
        </Value>
      </Row>
      {isMultiSend ? (
        data.txData.dataDecoded?.parameters?.[0]?.valueDecoded?.map((v, i) => (
          <Row key={i} title={`${t('Action')} #${i + 1}`}>
            <Decode to={v.to} data={v.dataDecoded} />
          </Row>
        ))
      ) : (
        <Row title={t('Action')}>
          <Decode to={data.txData.to.value} data={data.txData.dataDecoded} />
        </Row>
      )}
    </Box>
  );
}
