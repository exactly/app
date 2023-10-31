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
import { getAddress } from 'viem';
import Link from 'next/link';

import { type SafeResponse, type Transaction, useTransaction, type Call } from '../api';
import Decode, { DecodeCall } from '../Decode';

import { formatTx, formatWallet } from 'utils/utils';
import parseTimestamp from 'utils/parseTimestamp';
import useEtherscanLink from 'hooks/useEtherscanLink';
import Pill from 'components/common/Pill';

export type Entry = {
  schedule?: Transaction;
  events?: Call[];
  execution?: Transaction;
  timestamp: number;
};

type Props = {
  title: string;
  empty: string;
  isLoading: boolean;
  data: Entry[];
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
        {isLoading ? (
          <>
            <Skeleton variant="rectangular" height={48} sx={{ borderRadius: 2 }} />
          </>
        ) : data.length === 0 ? (
          <Typography textAlign="center" color="grey.400">
            {empty}
          </Typography>
        ) : (
          data.flatMap((e) =>
            !e.execution && !e.schedule && e.events && e.events.length > 0 ? (
              <EventCall calls={e.events} />
            ) : e.execution || e.schedule ? (
              <Event entry={e} />
            ) : null,
          )
        )}
      </Box>
    </Box>
  );
}

export function group(safe: SafeResponse, calls: Call[]): Entry[] {
  const grouped = calls.reduce(
    (store, call) => {
      const timestamp = call.executedAt ?? call.scheduledAt;
      store[timestamp] = store[timestamp] ? [...store[timestamp], call] : [call];
      return store;
    },
    {} as Record<number, Call[]>,
  );

  const transactions = safe.results.flatMap((tx) => (tx.type === 'TRANSACTION' ? [tx.transaction] : []));
  const leftovers = new Set(transactions);

  const entries: Entry[] = [];

  for (const events of Object.values(grouped)) {
    if (events.length === 0) {
      continue;
    }

    const call = events[0];
    const entry: Entry = { events, timestamp: call.executedAt ?? call.scheduledAt };

    entry.schedule = transactions.find((tx) => tx.timestamp / 1000 === call.scheduledAt);
    if (call.executedAt) {
      entry.execution = transactions.find((tx) => tx.timestamp / 1000 === call.executedAt);
    }

    if (entry.schedule) leftovers.delete(entry.schedule);
    if (entry.execution) leftovers.delete(entry.execution);

    entries.push(entry);
  }

  const rest = [...leftovers].map<Entry>((tx) => ({
    execution: tx,
    timestamp: tx.timestamp / 1000,
  }));

  return [...entries, ...rest].sort((x, y) => y.timestamp - x.timestamp);
}

function EventCall({ calls }: { calls: Call[] }) {
  const { t } = useTranslation();
  const call = calls[0];
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
    >
      <AccordionSummary
        sx={{
          '&:hover': { backgroundColor: ({ palette }) => (palette.mode === 'dark' ? '#ffffff0b' : '#F0F1F2') },
          height: 90,
          p: 3,
          '& .MuiAccordionSummary-content': { m: 0, mr: 3, justifyContent: 'space-between' },
        }}
        expandIcon={<ExpandMoreIcon sx={{ fontSize: 16, color: 'grey.900' }} />}
        aria-controls={`${call.id}_content`}
        id={`${call.id}_header`}
      >
        <Box>
          <Box display="flex" alignItems="center" gap={0.5} color="grey.900">
            <Typography component="span" fontSize={14} fontWeight={500} fontFamily="fontFamilyMonospaced">
              •
            </Typography>
            <Typography component="span" variant="h6">
              {t('Event')}:
            </Typography>
            <Typography
              component="span"
              variant="h6"
              fontWeight={500}
              maxWidth={{ xs: 160, sm: 'min-content' }}
              sx={{
                whiteSpace: 'nowrap',
                textOverflow: 'ellipsis',
                overflowX: 'hidden',
              }}
            >
              {call.executedAt ? t('Call Executed') : t('Call Scheduled')}
            </Typography>
          </Box>
        </Box>
        <Box display="flex" flexDirection="column" alignItems="flex-end">
          <Typography component="div" variant="h6" textAlign="right" mb={0.2} whiteSpace="nowrap">
            {calls.length} {calls.length === 1 ? t('Action') : t('Actions')}
          </Typography>
          {call.executedAt !== null && <Pill text={t('Executed')} />}
        </Box>
      </AccordionSummary>
      <AccordionDetails sx={{ p: 0 }}>
        <EventSummaryCall calls={calls} />
      </AccordionDetails>
    </Accordion>
  );
}

function Event({ entry }: { entry: Entry }) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const tx = entry?.execution || entry?.schedule;

  if (!tx) return null;

  const actions = tx.txInfo.actionCount ?? 1;

  const method = (methodName: string | null, txType: string | null) => {
    if (methodName === 'multiSend') {
      return t('Multiple transactions');
    }

    if (methodName === 'execute') {
      return t('Execution');
    }

    if (methodName === 'schedule') {
      return t('Schedule');
    }

    if (txType) {
      return txType;
    }

    return t('Unknown');
  };

  const context = { SettingSchange: 'Safe', Creation: 'Safe' }[tx.txInfo.type] ?? 'Protocol';

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
              •
            </Typography>
            <Typography component="span" variant="h6">
              {context}:
            </Typography>
            <Typography
              component="span"
              variant="h6"
              fontWeight={500}
              maxWidth={{ xs: 160, sm: 'min-content' }}
              sx={{
                whiteSpace: 'nowrap',
                textOverflow: 'ellipsis',
                overflowX: 'hidden',
              }}
            >
              {tx.txInfo.type === 'SettingsChange' && tx.txInfo.humanDescription
                ? tx.txInfo.humanDescription
                : capitalize(method(tx.txInfo.methodName, tx.txInfo.type))}
            </Typography>
          </Box>
          <Box display="flex" alignItems="center" gap={0.5}>
            {tx?.executionInfo?.confirmationsRequired !== undefined &&
              tx?.executionInfo?.confirmationsSubmitted !== undefined && (
                <>
                  <Typography
                    component="span"
                    fontSize={14}
                    textTransform="uppercase"
                    fontWeight={500}
                    color="grey.400"
                  >
                    {t('Approved by')}:
                  </Typography>
                  <Typography component="span" fontSize={14} fontWeight={700} color="grey.700">
                    {tx.executionInfo.confirmationsSubmitted}/{tx?.executionInfo?.confirmationsRequired}
                  </Typography>
                </>
              )}
          </Box>
        </Box>
        <Box display="flex" flexDirection="column" alignItems="flex-end">
          <Typography component="div" variant="h6" textAlign="right" mb={0.2} whiteSpace="nowrap">
            {actions} {actions === 1 ? t('Action') : t('Actions')}
          </Typography>
          {tx.txStatus === 'SUCCESS' && <Pill text={t('Executed')} />}
        </Box>
      </AccordionSummary>
      <AccordionDetails sx={{ p: 0 }}>
        {open && <EventSummary tx={tx} entry={entry} isExecution={Boolean(entry.execution)} />}
      </AccordionDetails>
    </Accordion>
  );
}

type TitleProps = PropsWithChildren<{
  title: string;
  inner?: boolean;
}>;

function Row({ title, inner = false, children }: TitleProps) {
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
        ...(inner
          ? {
              '&:first-of-type': { paddingTop: 0, borderTop: 0 },
              '&:last-of-type': { paddingBottom: 0 },
              pl: 0,
            }
          : {}),
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

function EventSummary({
  entry,
  tx,
  isExecution,
  inner = false,
}: {
  entry: Entry;
  tx: Transaction;
  isExecution: boolean;
  inner?: boolean;
}) {
  const { t } = useTranslation();
  const { data, isLoading } = useTransaction(tx.id);

  const { breakpoints } = useTheme();
  const isMobile = useMediaQuery(breakpoints.down('sm'));

  const { tx: transaction, address } = useEtherscanLink();

  if (isLoading || !data) {
    return <Skel />;
  }

  if (!data.txData) {
    return (
      <Typography textAlign="center" py={2}>
        {t('Unable to decode transaction data')}
      </Typography>
    );
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
    <>
      <Box display="flex" flexDirection="column">
        {data.txHash && (
          <Row title={t('Transaction Hash')} inner={inner}>
            <Value>
              <Link href={transaction(data.txHash)} target="_blank" rel="noopener noreferrer">
                {formatTx(data.txHash)}
              </Link>
            </Value>
          </Row>
        )}
        <Row title={t('Submited At')} inner={inner}>
          <Value>{parseTimestamp(data.detailedExecutionInfo.submittedAt / 1000, 'YYYY-MM-DD HH:mm:ss')}</Value>
        </Row>
        {data.executedAt && (
          <Row title={t('Executed At')} inner={inner}>
            <Value>{parseTimestamp(data.executedAt / 1000, 'YYYY-MM-DD HH:mm:ss')}</Value>
          </Row>
        )}
        <Row title={t('Signers')} inner={inner}>
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
        {data.detailedExecutionInfo.executor && (
          <Row title={t('Executor')} inner={inner}>
            <Value>
              <Link href={address(data.detailedExecutionInfo.executor.value)} target="_blank" rel="noopener noreferrer">
                {format(data.detailedExecutionInfo.executor.value)}
              </Link>
            </Value>
          </Row>
        )}
        {isMultiSend ? (
          <Row title={t('Actions')} inner={inner}>
            <Box display="flex" flexDirection="column" gap={2}>
              {data.txData.dataDecoded?.parameters?.[0]?.valueDecoded?.map((v, i) => (
                <Decode key={i} to={v.to} data={v.dataDecoded} />
              ))}
            </Box>
          </Row>
        ) : (
          <Row title={t('Action')} inner={inner}>
            <Decode to={data.txData.to.value} data={data.txData.dataDecoded} />
          </Row>
        )}
        {isExecution && entry.schedule && (
          <Row title={t('Schedule')}>
            <EventSummary tx={entry.schedule} entry={entry} isExecution={false} inner />
          </Row>
        )}
      </Box>
    </>
  );
}

function EventSummaryCall({ calls }: { calls: Call[] }) {
  const { t } = useTranslation();

  const { breakpoints } = useTheme();
  const isMobile = useMediaQuery(breakpoints.down('sm'));

  const { address } = useEtherscanLink();

  const format = (value: string) => {
    const addr = getAddress(value);
    return isMobile ? formatWallet(addr) : addr;
  };

  const call = calls[0];

  return (
    <Box display="flex" flexDirection="column">
      <Row title={t('ID')}>
        <Value>{call.id}</Value>
      </Row>
      <Row title={t('Scheduler')}>
        <Value>
          <Link href={address(call.scheduler)} target="_blank" rel="noopener noreferrer">
            {format(call.scheduler)}
          </Link>
        </Value>
      </Row>
      <Row title={t('Scheduled At')}>
        <Value>{parseTimestamp(call.scheduledAt, 'YYYY-MM-DD HH:mm:ss')}</Value>
      </Row>
      {call.executedAt && call.executor && (
        <>
          <Row title={t('Executor')}>
            <Value>
              <Link href={address(call.executor)} target="_blank" rel="noopener noreferrer">
                {format(call.executor)}
              </Link>
            </Value>
          </Row>
          <Row title={t('Executed At')}>
            <Value>{parseTimestamp(call.executedAt, 'YYYY-MM-DD HH:mm:ss')}</Value>
          </Row>
        </>
      )}
      <Row title={calls.length === 1 ? t('Action') : t('Actions')}>
        <Box display="flex" flexDirection="column" gap={2}>
          {calls
            .flatMap((c) => c.operations)
            .map((operation) => (
              <DecodeCall
                key={`${operation.index}-${operation.target}-${operation.data}`}
                target={operation.target}
                data={operation.data}
              />
            ))}
        </Box>
      </Row>
    </Box>
  );
}
