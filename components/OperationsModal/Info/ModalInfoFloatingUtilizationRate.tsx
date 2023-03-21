import React, { useMemo } from 'react';
import { formatFixed, parseFixed } from '@ethersproject/bignumber';
import { Zero } from '@ethersproject/constants';
import PieChartOutlineRoundedIcon from '@mui/icons-material/PieChartOutlineRounded';

import ModalInfo, { FromTo, Variant } from 'components/common/modal/ModalInfo';
import { Operation } from 'contexts/ModalStatusContext';
import useAccountData from 'hooks/useAccountData';
import { toPercentage } from 'utils/utils';
import UtilizationRateChart from 'components/charts/UtilizationRateChart';
import { Box } from '@mui/material';

type Props = {
  qty: string;
  symbol: string;
  operation: Extract<Operation, 'deposit' | 'withdraw' | 'repay' | 'borrow'>;
  variant?: Variant;
};

function ModalInfoFloatingUtilizationRate({ qty, symbol, operation, variant = 'column' }: Props) {
  const { marketAccount } = useAccountData(symbol);

  const [from, to, rawTo] = useMemo(() => {
    if (!marketAccount) return [undefined, undefined];
    const { totalFloatingDepositAssets, totalFloatingBorrowAssets, decimals } = marketAccount;
    try {
      let deposited = totalFloatingDepositAssets ?? Zero;
      let borrowed = totalFloatingBorrowAssets ?? Zero;

      const decimalWAD = parseFixed('1', decimals);

      const f = borrowed.mul(decimalWAD).div(deposited);
      const delta = parseFixed(qty || '0', decimals);

      switch (operation) {
        case 'deposit':
          deposited = deposited.add(delta);
          break;
        case 'withdraw':
          deposited = deposited.sub(delta);
          break;
        case 'borrow':
          borrowed = borrowed.add(delta);
          break;
        case 'repay':
          borrowed = borrowed.sub(delta);
          break;
      }

      const t = borrowed.mul(decimalWAD).div(deposited);
      return [
        toPercentage(Number(formatFixed(f, decimals))),
        toPercentage(Number(formatFixed(t, decimals))),
        Number(formatFixed(t, decimals)),
      ];
    } catch {
      return [undefined, undefined];
    }
  }, [marketAccount, qty, operation]);

  return (
    <>
      <ModalInfo label="Pool Utilization Rate" icon={PieChartOutlineRoundedIcon} variant={variant}>
        <FromTo from={from} to={to} variant={variant} />
      </ModalInfo>
      <Box height={150} maxWidth="86vw" p={1}>
        <UtilizationRateChart type="floating" symbol={symbol} mini previewUtilization={rawTo} />
      </Box>
    </>
  );
}

export default React.memo(ModalInfoFloatingUtilizationRate);
