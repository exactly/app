import React from 'react';
import Image from 'next/image';
import { formatUnits } from 'viem';

import { Button, TableRow, TableCell, Stack, Typography, Skeleton, Box, ButtonGroup } from '@mui/material';

import type { Operation } from 'types/Operation';

import formatNumber from 'utils/formatNumber';
import formatSymbol from 'utils/formatSymbol';
import Link from 'next/link';
import SwitchCollateral from 'components/dashboard/DashboardContent/FloatingPoolDashboard/FloatingPoolDashboardTable/SwitchCollateral';
import useAccountData from 'hooks/useAccountData';
import useActionButton, { useStartDebtManagerButton } from 'hooks/useActionButton';
import useRouter from 'hooks/useRouter';
import { useTranslation } from 'react-i18next';
import Rates from 'components/Rates';

type Props = {
  symbol: string;
  type: Extract<Operation, 'deposit' | 'borrow'>;
  valueUSD?: number;
  depositedAmount?: bigint;
  borrowedAmount?: bigint;
  apr?: number;
};

function TableRowFloatingPool({ symbol, valueUSD, depositedAmount, borrowedAmount, type, apr }: Props) {
  const { t } = useTranslation();
  const { query } = useRouter();
  const { marketAccount } = useAccountData(symbol);

  const { handleActionClick } = useActionButton();
  const { startDebtManager, isRolloverDisabled } = useStartDebtManagerButton();

  return (
    <TableRow
      sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
      hover
      data-testid={`dashboard-floating-${type}-row-${symbol}`}
    >
      <Link href={{ pathname: `/${symbol}`, query }} legacyBehavior>
        <TableCell component="th" align="left" sx={{ cursor: 'pointer', pl: 1.5 }} width={240}>
          <Stack direction="row" spacing={1}>
            <Image
              src={`/img/assets/${symbol}.svg`}
              alt={symbol}
              width={24}
              height={24}
              style={{
                maxWidth: '100%',
                height: 'auto',
              }}
            />
            <Typography fontWeight="600" ml={1} display="inline" alignSelf="center">
              {formatSymbol(symbol)}
            </Typography>
          </Stack>
        </TableCell>
      </Link>
      <TableCell align="left" size="small">
        <Typography>
          {(depositedAmount !== undefined &&
            borrowedAmount !== undefined &&
            `${formatNumber(
              formatUnits(type === 'deposit' ? depositedAmount : borrowedAmount, marketAccount?.decimals ?? 18),
              symbol,
            )}`) || <Skeleton width={40} />}
        </Typography>
      </TableCell>
      <TableCell align="left" size="small">
        <Typography>
          {(valueUSD !== undefined && `$${formatNumber(valueUSD, 'USD', true)}`) || <Skeleton width={70} />}
        </Typography>
      </TableCell>
      <TableCell align="left" size="small">
        <Box display="flex" width="fit-content" gap={1}>
          <Rates symbol={symbol} apr={apr} type={type} />
        </Box>
      </TableCell>
      {type === 'deposit' ? (
        <TableCell align="left" size="small">
          <SwitchCollateral symbol={symbol} />
        </TableCell>
      ) : (
        <TableCell align="left" size="small" />
      )}

      <TableCell align="left" width={50} size="small" sx={{ px: 0.5 }}>
        <Button
          variant="contained"
          onClick={(e) => handleActionClick(e, type, symbol)}
          sx={{ whiteSpace: 'nowrap' }}
          data-testid={`floating-${type}-${symbol}`}
        >
          {type === 'deposit' ? t('Deposit') : t('Borrow')}
        </Button>
      </TableCell>

      <TableCell align="left" width={50} size="small" sx={{ pr: 1.5 }}>
        {type === 'deposit' ? (
          <Button
            variant="outlined"
            sx={{ backgroundColor: 'components.bg', whiteSpace: 'nowrap' }}
            onClick={(e) => handleActionClick(e, 'withdraw', symbol)}
            data-testid={`floating-withdraw-${symbol}`}
          >
            {t('Withdraw')}
          </Button>
        ) : (
          <ButtonGroup>
            <Button
              variant="outlined"
              sx={{ backgroundColor: 'components.bg', whiteSpace: 'nowrap', '&:hover': { zIndex: 1 } }}
              onClick={(e) => handleActionClick(e, 'repay', symbol)}
              data-testid={`floating-repay-${symbol}`}
            >
              {t('Repay')}
            </Button>
            <Button
              variant="outlined"
              sx={{
                backgroundColor: 'components.bg',
                whiteSpace: 'nowrap',
                '&:disabled': {
                  borderLeftColor: ({ palette }) => palette.grey[palette.mode === 'light' ? 500 : 300],
                },
              }}
              onClick={() => startDebtManager({ from: { symbol } })}
              disabled={isRolloverDisabled(borrowedAmount)}
              data-testid={`floating-rollover-${symbol}`}
            >
              {t('Rollover')}
            </Button>
          </ButtonGroup>
        )}
      </TableCell>
    </TableRow>
  );
}

export default TableRowFloatingPool;
