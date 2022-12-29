import React, { useContext, useMemo } from 'react';
import { BigNumber, formatFixed, parseFixed } from '@ethersproject/bignumber';
import { Zero } from '@ethersproject/constants';
import SaveAltRoundedIcon from '@mui/icons-material/SaveAltRounded';
import Image from 'next/image';

import useAccountData from 'hooks/useAccountData';
import formatNumber from 'utils/formatNumber';
import ModalInfo, { Variant, FromTo } from 'components/common/modal/ModalInfo';
import { isFixedOperation, Operation } from 'contexts/ModalStatusContext';
import { MarketContext } from 'contexts/MarketContext';
import formatSymbol from 'utils/formatSymbol';
import { Box } from '@mui/material';

type Props = {
  qty: string;
  symbol: string;
  operation: Extract<Operation, 'withdraw' | 'withdrawAtMaturity' | 'deposit' | 'depositAtMaturity'>;
  variant?: Variant;
};

function ModalInfoTotalDeposits({ qty, symbol, operation, variant = 'column' }: Props) {
  const { floatingDepositAssets, fixedDepositPositions, decimals } = useAccountData(symbol);
  const { date } = useContext(MarketContext);

  const [from, to] = useMemo(() => {
    if (!decimals || !floatingDepositAssets || !fixedDepositPositions) return [undefined, undefined];

    const delta = parseFixed(qty || '0', decimals);

    let f: BigNumber = floatingDepositAssets;
    if (isFixedOperation(operation) && date) {
      const pool = fixedDepositPositions.find(({ maturity }) => maturity.toNumber() === date);
      f = pool ? pool.position.principal.add(pool.position.fee) : Zero;
    }

    let t = f[operation.startsWith('deposit') ? 'add' : 'sub'](delta);
    t = t < Zero ? Zero : t;

    return [formatNumber(formatFixed(f, decimals), symbol), formatNumber(formatFixed(t, decimals), symbol)];
  }, [qty, symbol, operation, floatingDepositAssets, fixedDepositPositions, decimals, date]);

  return (
    <ModalInfo label="Total deposits" icon={SaveAltRoundedIcon} variant={variant}>
      <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 0.5 }}>
        {variant === 'column' && (
          <Image src={`/img/assets/${symbol}.svg`} alt={formatSymbol(symbol)} width={16} height={16} />
        )}
        <FromTo from={from} to={to} variant={variant} />
      </Box>
    </ModalInfo>
  );
}

export default React.memo(ModalInfoTotalDeposits);
