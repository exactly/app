import React from 'react';
import { useTranslation } from 'react-i18next';

import ModalInfo from 'components/common/modal/ModalInfo';
import useRewards from 'hooks/useRewards';
import RewardPill from 'components/markets/RewardPill';
import { Operation } from 'contexts/ModalStatusContext';
import { Skeleton } from '@mui/material';

type Props = {
  symbol: string;
  operation: Extract<Operation, 'borrow' | 'deposit'>;
};

function ModalRewards({ symbol, operation }: Props) {
  const { t } = useTranslation();
  const { rates, isLoading } = useRewards();

  const rate = rates[symbol];

  if (!rate || rate.length === 0) {
    return null;
  }

  return (
    <ModalInfo label={t('Rewards')} variant="row">
      {isLoading ? (
        <Skeleton width={100} />
      ) : (
        rates[symbol]?.map((r) => (
          <RewardPill
            key={r.asset}
            rate={operation === 'borrow' ? r.borrow : r.floatingDeposit}
            symbol={r.assetSymbol}
          />
        ))
      )}
    </ModalInfo>
  );
}

export default ModalRewards;
