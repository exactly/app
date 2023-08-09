import React, { useMemo } from 'react';
import SwapHorizIcon from '@mui/icons-material/SwapHoriz';
import { Box } from '@mui/material';
import Image from 'next/image';
import { formatUnits, parseUnits } from 'viem';

import useAccountData from 'hooks/useAccountData';
import formatNumber from 'utils/formatNumber';
import ModalInfo, { Variant, FromTo } from 'components/common/modal/ModalInfo';
import { isFixedOperation, type Operation } from 'types/Operation';
import formatSymbol from 'utils/formatSymbol';
import { useTranslation } from 'react-i18next';
import { useOperationContext } from 'contexts/OperationContext';

type Props = {
  qty: string;
  symbol: string;
  operation: Extract<Operation, 'repay' | 'repayAtMaturity' | 'borrow' | 'borrowAtMaturity'>;
  variant?: Variant;
};

function ModalInfoTotalBorrows({ qty, symbol, operation, variant = 'column' }: Props) {
  const { t } = useTranslation();
  const { marketAccount } = useAccountData(symbol);
  const { date } = useOperationContext();

  const [from, to] = useMemo(() => {
    if (!marketAccount) return [undefined, undefined];

    const delta = parseUnits(qty || '0', marketAccount.decimals);

    let f: bigint = marketAccount.floatingBorrowAssets;
    if (isFixedOperation(operation) && date) {
      const pool = marketAccount.fixedBorrowPositions.find(({ maturity }) => maturity === date);
      f = pool ? pool.position.principal + pool.position.fee : 0n;
    }

    let debt = operation.startsWith('borrow') ? f + delta : f - delta;
    debt = debt < 0n ? 0n : debt;

    return [
      formatNumber(formatUnits(f, marketAccount.decimals), symbol),
      formatNumber(formatUnits(debt, marketAccount.decimals), symbol),
    ];
  }, [marketAccount, qty, operation, date, symbol]);

  return (
    <ModalInfo label={t('Debt amount')} icon={SwapHorizIcon} variant={variant}>
      <Box display="flex" alignItems="center" gap={0.5}>
        {variant === 'column' && (
          <Image
            src={`/img/assets/${symbol}.svg`}
            alt={formatSymbol(symbol)}
            width={16}
            height={16}
            style={{
              maxWidth: '100%',
              height: 'auto',
            }}
          />
        )}
        <FromTo from={from} to={to} variant={variant} />
      </Box>
    </ModalInfo>
  );
}

export default React.memo(ModalInfoTotalBorrows);
