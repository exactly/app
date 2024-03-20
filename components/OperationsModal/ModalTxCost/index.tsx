import React from 'react';
import { Typography, Skeleton, Box } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { formatUnits } from 'viem';
import WAD from '@exactly/lib/esm/fixed-point-math/WAD';

import ModalInfo from 'components/common/modal/ModalInfo';
import useAccountData from 'hooks/useAccountData';
import useEstimateGas from 'hooks/useEstimateGas';
import useAsyncLoad from 'hooks/useAsyncLoad';

type Props = {
  gasCost?: bigint;
};

function ModalTxCost({ gasCost }: Props) {
  const { t } = useTranslation();
  const { marketAccount } = useAccountData('WETH');
  const estimate = useEstimateGas();
  const { data: fallback } = useAsyncLoad(estimate);

  const gas = gasCost || fallback;

  if (!gas || !marketAccount) return <Skeleton width={100} />;

  const eth = parseFloat(formatUnits(gas, 18)).toFixed(6);
  const usd = parseFloat(formatUnits((gas * marketAccount.usdPrice) / WAD, 18)).toFixed(2);

  return (
    <ModalInfo label={t('TX Cost')} variant="row">
      <Box display="flex" gap={0.5}>
        <Typography variant="modalRow">{`~$${usd}`}</Typography>
        <Typography variant="modalRow" color="figma.grey.600">{`(${eth} ETH)`}</Typography>
      </Box>
    </ModalInfo>
  );
}

export default ModalTxCost;
