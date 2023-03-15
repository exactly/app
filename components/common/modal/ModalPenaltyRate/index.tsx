import React from 'react';
import { formatFixed } from '@ethersproject/bignumber';
import { Typography, Skeleton } from '@mui/material';

import ModalInfo from '../ModalInfo';
import useAccountData from 'hooks/useAccountData';
import { toPercentage } from 'utils/utils';

type Props = {
  symbol: string;
};

function ModalPenaltyRate({ symbol }: Props) {
  const { penaltyRate } = useAccountData(symbol);

  return (
    <ModalInfo label="Late payment penalty daily rate" variant="row">
      {penaltyRate ? (
        <Typography fontWeight={700} fontSize={14}>
          {toPercentage(parseFloat(formatFixed(penaltyRate, 18)) * 86_400)}
        </Typography>
      ) : (
        <Skeleton width={100} />
      )}
    </ModalInfo>
  );
}

export default ModalPenaltyRate;
