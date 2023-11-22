import React, { MouseEvent, useCallback } from 'react';
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
import { track } from 'utils/segment';

type Props = {
  symbol: string;
  type: Extract<Operation, 'deposit' | 'borrow'>;
  valueUSD?: number;
  depositedAmount?: bigint;
  borrowedAmount?: bigint;
  apr?: number;
  simple?: boolean;
};

function TableRowFloatingPool({ symbol, valueUSD, depositedAmount, borrowedAmount, type, apr, simple }: Props) {
  const { t } = useTranslation();
  const { query } = useRouter();
  const { marketAccount } = useAccountData(symbol);

  const { handleActionClick } = useActionButton();
  const { startDebtManager, isRolloverDisabled } = useStartDebtManagerButton();

  const handleClick = useCallback(() => {
    track('Button Clicked', {
      name: 'Table Row Floating Pool',
      location: 'Dashboard',
      symbol,
      href: `/${symbol}`,
      amount: formatUnits(
        type === 'deposit' ? depositedAmount || 0n : borrowedAmount || 0n,
        marketAccount?.decimals ?? 18,
      ),
      usdAmount: String(valueUSD),
    });
  }, [borrowedAmount, depositedAmount, marketAccount?.decimals, symbol, type, valueUSD]);

  const handleOperationClick = useCallback(
    (e: MouseEvent<HTMLButtonElement>): void => {
      handleActionClick(e, type, symbol);
      track('Button Clicked', {
        name: type,
        location: 'Dashboard',
        symbol,
        amount: formatUnits(
          type === 'deposit' ? depositedAmount || 0n : borrowedAmount || 0n,
          marketAccount?.decimals ?? 18,
        ),
        usdAmount: String(valueUSD),
      });
    },
    [borrowedAmount, depositedAmount, handleActionClick, marketAccount?.decimals, symbol, type, valueUSD],
  );
  const handleWithdrawClick = useCallback(
    (e: MouseEvent<HTMLButtonElement>): void => {
      handleActionClick(e, 'withdraw', symbol);
      track('Button Clicked', {
        name: 'withdraw',
        location: 'Dashboard',
        symbol,
        amount: formatUnits(
          type === 'deposit' ? depositedAmount || 0n : borrowedAmount || 0n,
          marketAccount?.decimals ?? 18,
        ),
        usdAmount: String(valueUSD),
      });
    },
    [borrowedAmount, depositedAmount, handleActionClick, marketAccount?.decimals, symbol, type, valueUSD],
  );
  const handleRepayClick = useCallback(
    (e: MouseEvent<HTMLButtonElement>): void => {
      handleActionClick(e, 'repay', symbol);
      track('Button Clicked', {
        name: 'repay',
        location: 'Dashboard',
        symbol,
        amount: formatUnits(
          type === 'deposit' ? depositedAmount || 0n : borrowedAmount || 0n,
          marketAccount?.decimals ?? 18,
        ),
        usdAmount: String(valueUSD),
      });
    },
    [borrowedAmount, depositedAmount, handleActionClick, marketAccount?.decimals, symbol, type, valueUSD],
  );
  const handleRolloverClick = useCallback(() => {
    startDebtManager({ from: { symbol } });
    track('Button Clicked', {
      name: 'rollover',
      location: 'Dashboard',
      symbol,
      amount: formatUnits(
        type === 'deposit' ? depositedAmount || 0n : borrowedAmount || 0n,
        marketAccount?.decimals ?? 18,
      ),
      usdAmount: String(valueUSD),
    });
  }, [borrowedAmount, depositedAmount, marketAccount?.decimals, startDebtManager, symbol, type, valueUSD]);

  return (
    <TableRow
      sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
      hover
      data-testid={`dashboard-floating-${type}-row-${symbol}`}
    >
      <Link href={{ pathname: `/${symbol}`, query }} onClick={handleClick} legacyBehavior>
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
      {!simple && (
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
      )}
      <TableCell align="left" size="small">
        <Typography>
          {(valueUSD !== undefined && `$${formatNumber(valueUSD, 'USD', true)}`) || <Skeleton width={70} />}
        </Typography>
      </TableCell>
      {!simple && (
        <TableCell align="left" size="small">
          <Box display="flex" width="fit-content" gap={1}>
            <Rates symbol={symbol} apr={apr} type={type} />
          </Box>
        </TableCell>
      )}
      {type === 'deposit' ? (
        <TableCell align="left" size="small">
          <SwitchCollateral symbol={symbol} />
        </TableCell>
      ) : (
        <TableCell align="left" size="small" />
      )}

      {!simple && (
        <>
          <TableCell align="left" width={50} size="small" sx={{ px: 0.5 }}>
            <Button
              variant="contained"
              onClick={handleOperationClick}
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
                onClick={handleWithdrawClick}
                data-testid={`floating-withdraw-${symbol}`}
              >
                {t('Withdraw')}
              </Button>
            ) : (
              <ButtonGroup>
                <Button
                  variant="outlined"
                  sx={{ backgroundColor: 'components.bg', whiteSpace: 'nowrap', '&:hover': { zIndex: 1 } }}
                  onClick={handleRepayClick}
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
                  onClick={handleRolloverClick}
                  disabled={isRolloverDisabled(borrowedAmount)}
                  data-testid={`floating-rollover-${symbol}`}
                >
                  {t('Rollover')}
                </Button>
              </ButtonGroup>
            )}
          </TableCell>
        </>
      )}
    </TableRow>
  );
}

export default TableRowFloatingPool;
