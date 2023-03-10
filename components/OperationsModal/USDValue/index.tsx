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
  const { marketAccount } = useAccountData(symbol);

  const value = useMemo(() => {
    if (!qty || !marketAccount || !checkPrecision(qty, marketAccount.decimals)) return;

    const parsedqty = parseFixed(qty, marketAccount.decimals);
    const usd = parsedqty.mul(marketAccount.usdPrice).div(WeiPerEther);

    return formatFixed(usd, marketAccount.decimals);
  }, [qty, marketAccount]);

  return (
    <Typography color="figma.grey.500" fontWeight={500} fontSize={12} fontFamily="fontFamilyMonospaced">
      ~${formatNumber(value || '0', 'USD')}
    </Typography>
  );
}

export default React.memo(USDValue);
