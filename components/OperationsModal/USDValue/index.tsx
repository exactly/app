import React, { useMemo } from 'react';
import { Typography } from '@mui/material';
import { formatFixed, parseFixed } from '@ethersproject/bignumber';
import { WeiPerEther } from '@ethersproject/constants';

import useAccountData from 'hooks/useAccountData';
import formatNumber from 'utils/formatNumber';

type Props = {
  qty: string;
  symbol: string;
};

function USDValue({ qty, symbol }: Props) {
  const { usdPrice, decimals = 18 } = useAccountData(symbol);

  const value = useMemo(() => {
    if (!qty || !usdPrice) return;

    const parsedqty = parseFixed(qty, decimals);
    const usd = parsedqty.mul(usdPrice).div(WeiPerEther);

    return formatFixed(usd, decimals);
  }, [qty, decimals, usdPrice]);

  return (
    <Typography color="grey.600" fontWeight={500} fontSize={13}>
      ~${formatNumber(value || '0', 'USD')}
    </Typography>
  );
}

export default React.memo(USDValue);
