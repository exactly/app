import Image from 'next/image';
import Link from 'next/link';
import { useTranslation } from 'react-i18next';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import { Box, Button, ButtonGroup, IconButton, Skeleton, Stack, TableCell, TableRow, Typography } from '@mui/material';
import MaturityLinearProgress from 'components/common/MaturityLinearProgress';
import useFixedOperation from 'hooks/useFixedPoolTransactions';
import { Address, formatUnits } from 'viem';

import React, { useMemo, useState } from 'react';
import { FixedPoolTransaction } from 'types/FixedPoolTransaction';
import { calculateAPR } from 'utils/calculateAPR';
import formatNumber from 'utils/formatNumber';
import formatSymbol from 'utils/formatSymbol';
import parseTimestamp from 'utils/parseTimestamp';
import CollapseFixedPool from '../CollapseFixedPool';
import APRItem from '../APRItem';
import useActionButton, { useStartDebtManagerButton } from 'hooks/useActionButton';
import type { Deposit } from 'types/Deposit';
import type { WithdrawMP } from 'types/WithdrawMP';
import { Borrow } from 'types/Borrow';
import { Repay } from 'types/Repay';
import useAccountData from 'hooks/useAccountData';
import useRouter from 'hooks/useRouter';

type Props = {
  symbol: string;
  valueUSD?: number;
  type: 'deposit' | 'borrow';
  maturityDate: bigint;
  market: Address;
  decimals: number;
};

function TableRowFixedPool({ symbol, valueUSD, type, maturityDate, market, decimals }: Props) {
  const { t } = useTranslation();
  const { query } = useRouter();
  const { marketAccount } = useAccountData(symbol);
  const { withdrawTxs, repayTxs, depositTxs, borrowTxs } = useFixedOperation(type, maturityDate, market);
  const [open, setOpen] = useState(false);
  const { handleActionClick } = useActionButton();
  const { startDebtManager, isRolloverDisabled } = useStartDebtManagerButton();

  const exchangeRate: number | undefined = useMemo(() => {
    if (!marketAccount) return;
    return parseFloat(formatUnits(marketAccount.usdPrice, 18));
  }, [marketAccount]);

  const transactions: FixedPoolTransaction[] = useMemo(() => {
    const allTransactions = [...withdrawTxs, ...repayTxs, ...depositTxs, ...borrowTxs].sort(
      (a, b) => b.timestamp - a.timestamp,
    );

    if (!allTransactions || !exchangeRate) return [];
    const transformedTxs = allTransactions.map((transaction: Deposit | Borrow | WithdrawMP | Repay) => {
      const assets = formatUnits(transaction.assets, decimals);

      const txType =
        'fee' in transaction
          ? type === 'borrow'
            ? t('Borrow')
            : t('Deposit')
          : type === 'borrow'
          ? t('Repay')
          : t('Withdraw');

      const transactionAPR =
        'fee' in transaction
          ? calculateAPR(
              transaction.fee,
              transaction.assets,
              BigInt(transaction.timestamp),
              BigInt(transaction.maturity),
            )
          : undefined;

      const isBorrowOrDeposit = txType.toLowerCase() === 'borrow' || txType.toLowerCase() === 'deposit';
      const date = parseTimestamp(transaction.timestamp);
      const amountUSD = (parseFloat(assets) * exchangeRate).toFixed(2);

      return {
        id: transaction.id,
        type: txType,
        date,
        amount: assets,
        amountUSD,
        isBorrowOrDeposit,
        APR: transactionAPR ? Number(formatUnits(transactionAPR, 18)) : undefined,
      };
    });

    return transformedTxs;
  }, [withdrawTxs, repayTxs, depositTxs, borrowTxs, type, exchangeRate, decimals, t]);

  return (
    <>
      <TableRow
        sx={{ '& > *, & td': { borderBottom: 0 }, backgroundColor: open ? 'grey.100' : 'transparent' }}
        hover
        data-testid={`dashboard-fixed-${type}-row-${maturityDate}-${symbol}`}
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
          {valueUSD !== undefined ? `$${formatNumber(valueUSD, 'USD', true)}` : <Skeleton width={60} />}
        </TableCell>
        <TableCell align="left" size="small">
          <APRItem type={type} maturityDate={maturityDate} market={market} decimals={decimals} />
        </TableCell>
        <TableCell align="left" size="small">
          {maturityDate ? parseTimestamp(maturityDate) : <Skeleton width={80} />}
        </TableCell>
        <TableCell align="left" size="small" width={200}>
          <Box width={150}>
            {maturityDate ? (
              <MaturityLinearProgress maturityDate={maturityDate} operation={type} symbol={symbol} />
            ) : (
              <Skeleton sx={{ margin: 'auto' }} width={150} />
            )}
          </Box>
        </TableCell>
        <TableCell align="left" width={50} size="small" sx={{ px: 1 }}>
          {(maturityDate &&
            (type === 'deposit' ? (
              <Button
                data-testid={`fixed-${maturityDate}-withdraw-${symbol}`}
                variant="outlined"
                onClick={(e) => handleActionClick(e, 'withdrawAtMaturity', symbol, maturityDate)}
                sx={{ backgroundColor: 'components.bg', whiteSpace: 'nowrap' }}
              >
                {t('Withdraw')}
              </Button>
            ) : (
              <ButtonGroup>
                <Button
                  variant="outlined"
                  sx={{ backgroundColor: 'components.bg', whiteSpace: 'nowrap', '&:hover': { zIndex: 1 } }}
                  onClick={(e) => handleActionClick(e, 'repayAtMaturity', symbol, maturityDate)}
                  data-testid={`fixed-${maturityDate}-repay-${symbol}`}
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
                  onClick={() => startDebtManager({ from: { symbol, maturity: maturityDate } })}
                  disabled={isRolloverDisabled()}
                  data-testid={`fixed-rollover-${maturityDate}-${symbol}`}
                >
                  {t('Rollover')}
                </Button>
              </ButtonGroup>
            ))) || (
            <Skeleton
              sx={{ margin: 'auto', borderRadius: '32px' }}
              variant="rounded"
              height={34}
              width={type === 'borrow' ? 76 : 96}
            />
          )}
        </TableCell>
        <TableCell align="left" size="small" width={50}>
          <IconButton
            aria-label="expand row"
            size="small"
            onClick={() => setOpen(!open)}
            sx={{ border: '1px solid #E3E5E8', borderRadius: '24px' }}
          >
            {open ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />}
          </IconButton>
        </TableCell>
      </TableRow>
      <TableRow>
        <TableCell sx={{ py: 0, pr: 1.5 }} colSpan={7} size="small">
          <CollapseFixedPool open={open} transactions={transactions} />
        </TableCell>
      </TableRow>
    </>
  );
}

export default TableRowFixedPool;
