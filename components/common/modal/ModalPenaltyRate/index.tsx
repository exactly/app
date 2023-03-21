import React from 'react';
import { formatFixed } from '@ethersproject/bignumber';
import { Typography, Skeleton } from '@mui/material';

import ModalInfo from '../ModalInfo';
import useAccountData from 'hooks/useAccountData';
import { toPercentage } from 'utils/utils';
import { useTranslation } from 'react-i18next';

type Props = {
  symbol: string;
};

function ModalPenaltyRate({ symbol }: Props) {
  const { t } = useTranslation();
  const { marketAccount } = useAccountData(symbol);

  return (
    <ModalInfo label={t('Late payment penalty daily rate')} variant="row">
      {marketAccount ? (
        <Typography fontWeight={700} fontSize={14}>
          {toPercentage(parseFloat(formatFixed(marketAccount.penaltyRate, 18)) * 86_400)}
        </Typography>
      ) : (
        <Skeleton width={100} />
      )}
    </ModalInfo>
  );
}

export default ModalPenaltyRate;
