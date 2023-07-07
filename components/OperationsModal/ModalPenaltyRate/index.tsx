import React from 'react';
import { formatUnits } from 'viem';
import { Typography, Skeleton } from '@mui/material';
import { useTranslation } from 'react-i18next';

import ModalInfo from 'components/common/modal/ModalInfo';
import useAccountData from 'hooks/useAccountData';
import { toPercentage } from 'utils/utils';

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
          {toPercentage(Number(formatUnits(marketAccount.penaltyRate, 18)) * 86_400)}
        </Typography>
      ) : (
        <Skeleton width={100} />
      )}
    </ModalInfo>
  );
}

export default ModalPenaltyRate;
