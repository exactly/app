import React from 'react';
import { Address } from 'viem';
import { Box, Divider } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { useHistory, useQueued, useTimelockControllerEvents } from '../api';
import { ABIContext, type Contracts } from '../Decode';
import Events from '../Events';

type Props = {
  multisig: Address;
  contracts: Contracts;
};

export default React.memo(function Feed({ contracts, multisig }: Props) {
  const { t } = useTranslation();
  const { data: queued, isLoading: queuedIsLoading } = useQueued(multisig);
  const { data: history, isLoading: historyIsLoading } = useHistory(multisig);

  const { data: calls, isLoading: callsLoading } = useTimelockControllerEvents();

  return (
    <ABIContext.Provider value={contracts}>
      <Box display="flex" flexDirection="column" gap={6}>
        <Events
          title={t('Scheduled Transactions')}
          empty={t('No transactions queued at the moment.')}
          data={queued}
          calls={calls?.scheduled}
          isLoading={queuedIsLoading || callsLoading}
        />
        <Divider />
        <Events
          title={t('Executed Transactions')}
          empty={t('No transactions executed at the moment.')}
          data={history}
          calls={calls?.executed}
          isLoading={historyIsLoading || callsLoading}
        />
      </Box>
    </ABIContext.Provider>
  );
});
