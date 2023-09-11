import React from 'react';
import { Address } from 'viem';
import { Box, Divider } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { useHistory, useQueued } from '../api';
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

  return (
    <ABIContext.Provider value={contracts}>
      <Box display="flex" flexDirection="column" gap={6}>
        <Events
          title={t('Queued Transactions')}
          empty={t('No transactions queued at the moment.')}
          data={queued}
          isLoading={queuedIsLoading}
        />
        <Divider />
        <Events
          title={t('Past Transactions')}
          empty={t('No transactions executed at the moment.')}
          data={history}
          isLoading={historyIsLoading}
        />
      </Box>
    </ABIContext.Provider>
  );
});
