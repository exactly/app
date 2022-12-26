import React, { useMemo } from 'react';
import { formatFixed, parseFixed } from '@ethersproject/bignumber';
import { Zero } from '@ethersproject/constants';
import PieChartOutlineRoundedIcon from '@mui/icons-material/PieChartOutlineRounded';

import ModalInfo, { FromTo, Variant } from 'components/common/modal/ModalInfo';
import { Operation } from 'contexts/ModalStatusContext';
import useAccountData from 'hooks/useAccountData';
import { toPercentage } from 'utils/utils';

type Props = {
  qty: string;
  symbol: string;
  operation: Extract<Operation, 'deposit' | 'withdraw' | 'repay' | 'borrow'>;
  variant?: Variant;
};

function ModalInfoFloatingUtilizationRate({ qty, symbol, operation, variant = 'column' }: Props) {
  const { totalFloatingDepositAssets, totalFloatingBorrowAssets, decimals } = useAccountData(symbol);

  const [from, to] = useMemo(() => {
    if (!decimals) return [undefined, undefined];
    try {
      let deposited = totalFloatingDepositAssets ?? Zero;
      let borrowed = totalFloatingBorrowAssets ?? Zero;
      const f = borrowed.div(deposited);
      const delta = parseFixed(qty || '0', decimals);

      // const totalDepositUSD = formatFixed(totalDeposited.mul(exchangeRate).div(WeiPerEther), decimals);

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

      const t = borrowed.div(deposited);
      return [toPercentage(Number(formatFixed(f, 18))), toPercentage(Number(formatFixed(t, 18)))];
    } catch {
      return [undefined, undefined];
    }
  }, [qty, totalFloatingDepositAssets, totalFloatingBorrowAssets, operation, decimals]);

  return (
    <ModalInfo label="Pool Utilization Rate" icon={PieChartOutlineRoundedIcon} variant={variant}>
      <FromTo from={from} to={to} variant={variant} />
    </ModalInfo>
  );
}

export default React.memo(ModalInfoFloatingUtilizationRate);
