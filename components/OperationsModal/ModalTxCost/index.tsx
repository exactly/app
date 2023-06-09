import React, { useMemo } from 'react';
import { Typography, Skeleton, Box } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { formatUnits } from 'viem';
import { WEI_PER_ETHER } from 'utils/const';

import ModalInfo from 'components/common/modal/ModalInfo';
import useAccountData from 'hooks/useAccountData';

type Props = {
  gasCost?: bigint;
};

function ModalTxCost({ gasCost }: Props) {
  const { t } = useTranslation();
  const { marketAccount } = useAccountData('WETH');

  const renderGas = useMemo(() => {
    if (!gasCost || !marketAccount) return <Skeleton width={100} />;

    const eth = parseFloat(formatUnits(gasCost, 18)).toFixed(6);
    const usd = parseFloat(formatUnits((gasCost * marketAccount.usdPrice) / WEI_PER_ETHER, 18)).toFixed(2);

    return (
      <Box display="flex" gap={0.5}>
        <Typography variant="modalRow">{`~$${usd}`}</Typography>
        <Typography variant="modalRow" color="figma.grey.600">{`(${eth} ETH)`}</Typography>
      </Box>
    );
  }, [gasCost, marketAccount]);

  return (
    <ModalInfo label={t('TX Cost')} variant="row">
      {renderGas}
    </ModalInfo>
  );
}

export default ModalTxCost;
