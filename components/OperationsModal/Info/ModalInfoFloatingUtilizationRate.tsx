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
import interestRateCurve from 'utils/interestRateCurve';

type Props = {
  qty: string;
  symbol: string;
  operation: Extract<Operation, 'deposit' | 'withdraw' | 'repay' | 'borrow'>;
  variant?: Variant;
};

function ModalInfoFloatingUtilizationRate({ qty, symbol, operation, variant = 'column' }: Props) {
  const { marketAccount } = useAccountData(symbol);

  const [from, to, rawFrom, rawTo, floatingRate] = useMemo(() => {
    if (!marketAccount) return [undefined, undefined, undefined, undefined, undefined];
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

      const { interestRateModel } = marketAccount;
      const { A, B, UMax } = {
        A: interestRateModel.floatingCurveA,
        B: interestRateModel.floatingCurveB,
        UMax: interestRateModel.floatingMaxUtilization,
      };
      const curve = interestRateCurve(Number(A) / 1e18, Number(B) / 1e18, Number(UMax) / 1e18);
      const fromUtilization = Number(formatFixed(f, decimals));
      const toUtilization = Number(formatFixed(t, decimals));
      const rate = curve(toUtilization);
      return [toPercentage(fromUtilization), toPercentage(toUtilization), fromUtilization, toUtilization, rate];
    } catch {
      return [undefined, undefined];
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
            floatingRate={floatingRate}
          />
        </Box>
      )}
    </>
  );
}

export default React.memo(ModalInfoFloatingUtilizationRate);
