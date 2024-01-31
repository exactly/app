import React, { useMemo } from 'react';
import PieChartOutlineRoundedIcon from '@mui/icons-material/PieChartOutlineRounded';
import { useTranslation } from 'react-i18next';
import { formatUnits, parseUnits } from 'viem';

import ModalInfo, { FromTo, Variant } from 'components/common/modal/ModalInfo';
import type { Operation } from 'types/Operation';
import useAccountData from 'hooks/useAccountData';
import { toPercentage } from 'utils/utils';

type Props = {
  qty: string;
  symbol: string;
  operation: Extract<Operation, 'deposit' | 'withdraw' | 'repay' | 'borrow'>;
  variant?: Variant;
};

function ModalInfoFloatingUtilizationRate({ qty, symbol, operation, variant = 'column' }: Props) {
  const { t } = useTranslation();
  const { marketAccount } = useAccountData(symbol);

  const [from, to] = useMemo(() => {
    if (!marketAccount) return [undefined, undefined, undefined, undefined];
    const { totalFloatingDepositAssets, totalFloatingBorrowAssets, decimals } = marketAccount;
    try {
      let deposited = totalFloatingDepositAssets;
      let borrowed = totalFloatingBorrowAssets;

      const decimalWAD = parseUnits('1', decimals);

      const f = (borrowed * decimalWAD) / deposited;
      const delta = parseUnits(qty || '0', decimals);

      switch (operation) {
        case 'deposit':
          deposited += delta;
          break;
        case 'withdraw':
          deposited -= delta;
          break;
        case 'borrow':
          borrowed += delta;
          break;
        case 'repay':
          borrowed -= delta;
          break;
      }

      const utilization = (borrowed * decimalWAD) / deposited;
      const fromUtilization = Number(formatUnits(f, decimals));
      const toUtilization = Number(formatUnits(utilization, decimals));

      return [toPercentage(fromUtilization), toPercentage(toUtilization)];
    } catch {
      return [undefined, undefined, undefined, undefined];
    }
  }, [marketAccount, qty, operation]);

  return (
    <>
      <ModalInfo label={t('Pool Utilization Rate')} icon={PieChartOutlineRoundedIcon} variant={variant}>
        <FromTo from={from} to={to} variant={variant} />
      </ModalInfo>
    </>
  );
}

export default React.memo(ModalInfoFloatingUtilizationRate);
