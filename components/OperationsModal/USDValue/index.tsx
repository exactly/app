import React, { useMemo } from 'react';
import { Typography } from '@mui/material';
import { formatUnits, parseUnits } from 'viem';
import { WEI_PER_ETHER } from 'utils/const';

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

    const parsedqty = parseUnits(qty as `${number}`, marketAccount.decimals);
    const usd = (parsedqty * marketAccount.usdPrice) / WEI_PER_ETHER;

    return formatUnits(usd, marketAccount.decimals);
  }, [qty, marketAccount]);

  return (
    <Typography color="figma.grey.500" fontWeight={500} fontSize={13} fontFamily="fontFamilyMonospaced">
      ~${formatNumber(value || '0', 'USD')}
    </Typography>
  );
}

export default React.memo(USDValue);
