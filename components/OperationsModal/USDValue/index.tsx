import React, { useMemo } from 'react';
import { Typography } from '@mui/material';
import { formatFixed, parseFixed } from '@ethersproject/bignumber';
import { WeiPerEther } from '@ethersproject/constants';

import useAccountData from 'hooks/useAccountData';
import formatNumber from 'utils/formatNumber';
import { checkPrecision } from 'utils/utils';

type Props = {
  qty: string;
  symbol: string;
};

function USDValue({ qty, symbol }: Props) {
  const { usdPrice, decimals = 18 } = useAccountData(symbol);

  const value = useMemo(() => {
    if (!qty || !usdPrice || !checkPrecision(qty, decimals)) return;

    const parsedqty = parseFixed(qty, decimals);
    const usd = parsedqty.mul(usdPrice).div(WeiPerEther);

    return formatFixed(usd, decimals);
  }, [qty, decimals, usdPrice]);

  return (
    <Typography color="figma.grey.500" fontWeight={500} fontSize={13} fontFamily="fontFamilyMonospaced">
      ~${formatNumber(value || '0', 'USD')}
    </Typography>
  );
}

export default React.memo(USDValue);
