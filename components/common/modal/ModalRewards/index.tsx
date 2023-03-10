import React from 'react';

import ModalInfo from '../ModalInfo';
import useRewards from 'hooks/useRewards';
import RewardPill from 'components/markets/RewardPill';
import { Operation } from 'contexts/ModalStatusContext';
import { Skeleton } from '@mui/material';

type Props = {
  symbol: string;
  operation: Extract<Operation, 'borrow' | 'deposit'>;
};

function ModalRewards({ symbol, operation }: Props) {
  const { rates, isLoading } = useRewards();

  const rate = rates[symbol];

  if (!rate || rate.length === 0) {
    return null;
  }

  return (
    <ModalInfo label="Rewards" variant="row">
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
