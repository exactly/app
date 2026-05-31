import React, { useMemo } from 'react';
import { Address, Hex } from 'viem';
import { Box, Divider } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { useContractEvents } from 'wagmi';

import { timelockControllerAbi, timelockControllerAddress, timelockControllerBlock } from 'generated/wagmi';
import { defaultChain } from 'utils/client';
import { ABIContext, type Contracts } from '../Decode';
import Events, { group, type Entry } from '../Events';
import type { Call, SafeResponse } from '../types';

type Props = {
  multisig: Address;
  contracts: Contracts;
};

const base = `https://safe-client.safe.global/v1/chains/${defaultChain.id}`;

function useSafeTransactions(multisig: Address, kind: 'queued' | 'history') {
  return useQuery({
    queryKey: ['safe', kind, multisig],
    queryFn: (): Promise<SafeResponse> =>
      fetch(`${base}/safes/${multisig}/transactions/${kind}?cursor=${encodeURIComponent('limit=40&offset=0')}`).then(
        (response) => {
          if (!response.ok) throw new Error(`safe ${response.status}`);
          return response.json();
        },
      ),
  });
}

export default React.memo(function Feed({ contracts, multisig }: Props) {
  const { t } = useTranslation();
  const { data: queued, isLoading: queuedIsLoading } = useSafeTransactions(multisig, 'queued');
  const { data: history, isLoading: historyIsLoading } = useSafeTransactions(multisig, 'history');

  const address = timelockControllerAddress[defaultChain.id as keyof typeof timelockControllerAddress];
  const fromBlock = timelockControllerBlock[defaultChain.id as keyof typeof timelockControllerBlock];
  const enabled = Boolean(address);
  const events = {
    abi: timelockControllerAbi,
    address,
    fromBlock,
    strict: true,
    chainId: defaultChain.id,
    query: { enabled },
  } as const;
  const { data: scheduledLogs } = useContractEvents({ ...events, eventName: 'CallScheduled' });
  const { data: executedLogs } = useContractEvents({ ...events, eventName: 'CallExecuted' });
  const { data: cancelledLogs } = useContractEvents({ ...events, eventName: 'Cancelled' });

  const calls = useMemo(() => {
    if (!scheduledLogs || !executedLogs || !cancelledLogs) return undefined;
    const executed = executedLogs.reduce(
      (state, log) => state.set(log.args.id, Number(log.blockTimestamp)),
      new Map<Hex, number>(),
    );
    const cancelled = cancelledLogs.reduce(
      (state, log) => state.set(log.args.id, Number(log.blockTimestamp)),
      new Map<Hex, number>(),
    );
    const grouped = new Map<Hex, Call>();
    for (const log of scheduledLogs) {
      const operation = { index: Number(log.args.index), target: log.args.target, data: log.args.data };
      const call = grouped.get(log.args.id);
      if (call) {
        call.operations.push(operation);
      } else {
        grouped.set(log.args.id, {
          id: log.args.id,
          operations: [operation],
          scheduledAt: Number(log.blockTimestamp),
          executedAt: executed.get(log.args.id) ?? null,
          cancelledAt: cancelled.get(log.args.id) ?? null,
        });
      }
    }
    return [...grouped.values()]
      .sort((x, y) => y.scheduledAt - x.scheduledAt)
      .slice(0, 150)
      .reduce(
        (state, call) => {
          (call.cancelledAt ? state.cancelled : call.executedAt ? state.executed : state.scheduled).push(call);
          return state;
        },
        { scheduled: [] as Call[], executed: [] as Call[], cancelled: [] as Call[] },
      );
  }, [scheduledLogs, executedLogs, cancelledLogs]);

  const [scheduled, executed] = useMemo<[Entry[], Entry[]]>(() => {
    if (!queued || !history || !calls) return [[], []];
    const _scheduled = group(queued, calls.scheduled);
    const _executed: Entry[] = [];

    for (const entry of group(history, calls.executed)) {
      if (entry.schedule && !entry.execution) {
        _scheduled.push(entry);
      } else {
        _executed.push(entry);
      }
    }

    return [_scheduled.sort((x, y) => y.timestamp - x.timestamp), _executed];
  }, [queued, history, calls]);

  return (
    <ABIContext.Provider value={contracts}>
      <Box display="flex" flexDirection="column" gap={6}>
        <Events
          title={t('Scheduled Transactions')}
          empty={t('No transactions queued at the moment.')}
          data={scheduled}
          isLoading={queuedIsLoading || (enabled && !calls)}
        />
        <Divider />
        <Events
          title={t('Executed Transactions')}
          empty={t('No transactions executed at the moment.')}
          data={executed}
          isLoading={historyIsLoading || (enabled && !calls)}
        />
      </Box>
    </ABIContext.Provider>
  );
});
