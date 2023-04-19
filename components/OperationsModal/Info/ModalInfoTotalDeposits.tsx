import React, { useMemo } from 'react';
import { BigNumber, formatFixed, parseFixed } from '@ethersproject/bignumber';
import { Zero } from '@ethersproject/constants';
import SaveAltRoundedIcon from '@mui/icons-material/SaveAltRounded';
import Image from 'next/image';
import { useTranslation } from 'react-i18next';

import useAccountData from 'hooks/useAccountData';
import formatNumber from 'utils/formatNumber';
import ModalInfo, { Variant, FromTo } from 'components/common/modal/ModalInfo';
import { isFixedOperation, Operation } from 'contexts/ModalStatusContext';
import { useMarketContext } from 'contexts/MarketContext';
import formatSymbol from 'utils/formatSymbol';
import { Box } from '@mui/material';

type Props = {
  qty: string;
  symbol: string;
  operation: Extract<Operation, 'withdraw' | 'withdrawAtMaturity' | 'deposit' | 'depositAtMaturity'>;
  variant?: Variant;
};

function ModalInfoTotalDeposits({ qty, symbol, operation, variant = 'column' }: Props) {
  const { t } = useTranslation();
  const { marketAccount } = useAccountData(symbol);
  const { date } = useMarketContext();

  const [from, to] = useMemo(() => {
    if (!marketAccount) return [undefined, undefined];

    const delta = parseFixed(qty || '0', marketAccount.decimals);

    let f: BigNumber = marketAccount.floatingDepositAssets;
    if (isFixedOperation(operation) && date) {
      const pool = marketAccount.fixedDepositPositions.find(({ maturity }) => maturity.toNumber() === date);
      f = pool ? pool.position.principal.add(pool.position.fee) : Zero;
    }

    let total = f[operation.startsWith('deposit') ? 'add' : 'sub'](delta);
    total = total < Zero ? Zero : total;

    return [
      formatNumber(formatFixed(f, marketAccount.decimals), symbol),
      formatNumber(formatFixed(total, marketAccount.decimals), symbol),
    ];
  }, [marketAccount, qty, operation, date, symbol]);

  return (
    <ModalInfo label={t('Total deposits')} icon={SaveAltRoundedIcon} variant={variant}>
      <Box display="flex" alignItems="center" gap={0.5}>
        {variant === 'column' && (
          <Image src={`/img/assets/${symbol}.svg`} alt={formatSymbol(symbol)} width={16} height={16} />
        )}
        <FromTo from={from} to={to} variant={variant} />
      </Box>
    </ModalInfo>
  );
}

export default React.memo(ModalInfoTotalDeposits);
