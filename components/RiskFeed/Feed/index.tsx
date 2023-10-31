import React, { useMemo } from 'react';
import { Address } from 'viem';
import { Box, Divider } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { useHistory, useQueued, useTimelockControllerEvents } from '../api';
import { ABIContext, type Contracts } from '../Decode';
import Events, { group, type Entry } from '../Events';

type Props = {
  multisig: Address;
  contracts: Contracts;
};

export default React.memo(function Feed({ contracts, multisig }: Props) {
  const { t } = useTranslation();
  const { data: queued, isLoading: queuedIsLoading } = useQueued(multisig);
  const { data: history, isLoading: historyIsLoading } = useHistory(multisig);

  const { data: calls, isLoading: callsLoading } = useTimelockControllerEvents();

  const [scheduled, executed] = useMemo<[Entry[], Entry[]]>(() => {
    if (!queued || !history || !calls) return [[], []];
    const _queued = group(queued, calls.scheduled);
    const _history = group(history, calls.executed);
    const _scheduled = _queued;
    const _executed: Entry[] = [];

    for (const entry of _history) {
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
          isLoading={queuedIsLoading || callsLoading}
        />
        <Divider />
        <Events
          title={t('Executed Transactions')}
          empty={t('No transactions executed at the moment.')}
          data={executed}
          isLoading={historyIsLoading || callsLoading}
        />
      </Box>
    </ABIContext.Provider>
  );
});
