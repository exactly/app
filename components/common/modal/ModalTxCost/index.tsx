import React, { useMemo } from 'react';
import { BigNumber, formatFixed } from '@ethersproject/bignumber';
import { Typography, Skeleton, Box } from '@mui/material';

import { WeiPerEther } from '@ethersproject/constants';
import ModalInfo from '../ModalInfo';
import useAccountData from 'hooks/useAccountData';

type Props = {
  gasCost?: BigNumber;
};

function ModalTxCost({ gasCost }: Props) {
  const { marketAccount } = useAccountData('WETH');

  const renderGas = useMemo(() => {
    if (!gasCost || !marketAccount) return <Skeleton width={100} />;

    const eth = parseFloat(formatFixed(gasCost, 18)).toFixed(6);
    const usd = parseFloat(formatFixed(gasCost.mul(marketAccount.usdPrice).div(WeiPerEther), 18)).toFixed(2);

    return (
      <Box display="flex" gap={0.5}>
        <Typography variant="modalRow">{`~$${usd}`}</Typography>
        <Typography variant="modalRow" color="figma.grey.600">{`(${eth} ETH)`}</Typography>
      </Box>
    );
  }, [gasCost, marketAccount]);

  return (
    <ModalInfo label="TX Cost" variant="row">
      {renderGas}
    </ModalInfo>
  );
}

export default ModalTxCost;
