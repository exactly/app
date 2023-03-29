import React, { useMemo } from 'react';
import { formatFixed, parseFixed } from '@ethersproject/bignumber';
import { Zero } from '@ethersproject/constants';
import PieChartOutlineRoundedIcon from '@mui/icons-material/PieChartOutlineRounded';

import ModalInfo, { FromTo, Variant } from 'components/common/modal/ModalInfo';
import { Operation } from 'contexts/ModalStatusContext';
import useAccountData from 'hooks/useAccountData';
import { toPercentage } from 'utils/utils';
import UtilizationRateWithAreaChart from 'components/charts/UtilizationRateWithAreaChart';
import { Box } from '@mui/material';
import useFloatingRate from 'hooks/useFloatingRate';

type Props = {
  qty: string;
  symbol: string;
  operation: Extract<Operation, 'deposit' | 'withdraw' | 'repay' | 'borrow'>;
  variant?: Variant;
};

function ModalInfoFloatingUtilizationRate({ qty, symbol, operation, variant = 'column' }: Props) {
  const { marketAccount } = useAccountData(symbol);
  const rate = useFloatingRate(operation, symbol, qty);

  const [from, to, rawFrom, rawTo] = useMemo(() => {
    if (!marketAccount) return [];
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
      const fromUtilization = Number(formatFixed(f, decimals));
      const toUtilization = Number(formatFixed(t, decimals));

      return [toPercentage(fromUtilization), toPercentage(toUtilization), fromUtilization, toUtilization];
    } catch {
      return [];
    }
  }, [marketAccount, qty, operation]);

  return (
    <>
      <ModalInfo label="Pool Utilization Rate" icon={PieChartOutlineRoundedIcon} variant={variant}>
        <FromTo from={from} to={to} variant={variant} />
      </ModalInfo>
      {variant === 'row' && (
        <Box height={150} maxWidth="86vw" p={1} mx="auto">
          <UtilizationRateWithAreaChart
            type="floating"
            operation={operation}
            symbol={symbol}
            from={rawFrom}
            to={rawTo}
            floatingRate={rate}
          />
        </Box>
      )}
    </>
  );
}

export default React.memo(ModalInfoFloatingUtilizationRate);
