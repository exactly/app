import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { BigNumber, formatFixed } from '@ethersproject/bignumber';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import { Box, Button, IconButton, Skeleton, Stack, TableCell, TableRow, Typography } from '@mui/material';
import MaturityLinearProgress from 'components/common/MaturityLinearProgress';
import AccountDataContext from 'contexts/AccountDataContext';
import useFixedOperation from 'hooks/useFixedPoolTransactions';

import React, { useContext, useMemo, useState } from 'react';
import { FixedPoolTransaction } from 'types/FixedPoolTransaction';
import calculateAPR from 'utils/calculateAPR';
import formatNumber from 'utils/formatNumber';
import formatSymbol from 'utils/formatSymbol';
import parseTimestamp from 'utils/parseTimestamp';
import CollapseFixedPool from '../CollapseFixedPool';
import APRItem from '../APRItem';
import useActionButton from 'hooks/useActionButton';

type Props = {
  symbol: string;
  amount: BigNumber;
  type: 'deposit' | 'borrow';
  maturityDate: string;
  market: string;
  decimals: number;
};

function TableRowFixedPool({ symbol, amount, type, maturityDate, market, decimals }: Props) {
  const { accountData } = useContext(AccountDataContext);
  const { withdrawTxs, repayTxs, depositTxs, borrowTxs } = useFixedOperation(type, maturityDate, market);
  const [open, setOpen] = useState(false);
  const { query } = useRouter();
  const { handleActionClick } = useActionButton();

  const exchangeRate: number | undefined = useMemo(() => {
    if (!accountData) return;
    const rate = parseFloat(formatFixed(accountData[symbol].usdPrice, 18));
    return rate;
  }, [accountData, symbol]);

  const transactions: FixedPoolTransaction[] = useMemo(() => {
    const allTransactions = [...withdrawTxs, ...repayTxs, ...depositTxs, ...borrowTxs].sort(
      (a, b) => parseInt(b.timestamp) - parseInt(a.timestamp),
    );

    if (!allTransactions || !exchangeRate) return [];
    const transformedTxs = allTransactions.map((transaction: any) => {
      const assets = formatFixed(transaction.assets, decimals);

      const txType = transaction?.fee
        ? type === 'borrow'
          ? 'Borrow'
          : 'Deposit'
        : type === 'borrow'
        ? 'Repay'
        : 'Withdraw';

      const { transactionAPR } = transaction?.fee
        ? calculateAPR(transaction.fee, decimals, transaction.assets, transaction.timestamp, transaction.maturity)
        : { transactionAPR: undefined };

      const isBorrowOrDeposit = txType.toLowerCase() === 'borrow' || txType.toLowerCase() === 'deposit';
      const date = parseTimestamp(transaction?.timestamp || '0');
      const amountUSD = (parseFloat(assets) * exchangeRate).toFixed(2);

      return {
        id: transaction.id,
        type: txType,
        date,
        amount: assets,
        amountUSD,
        isBorrowOrDeposit,
        APR: transactionAPR,
      };
    });

    return transformedTxs;
  }, [withdrawTxs, repayTxs, depositTxs, borrowTxs, type, exchangeRate, decimals]);

  return (
    <>
      <TableRow sx={{ '& > *': { borderBottom: 'unset' }, backgroundColor: open ? 'grey.50' : 'transparent' }} hover>
        <Link href={{ pathname: `/${symbol}`, query }} legacyBehavior>
          <TableCell component="th" align="left" sx={{ cursor: 'pointer' }} width={240}>
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
          {exchangeRate ? (
            `$${formatNumber(parseFloat(formatFixed(amount, decimals)) * exchangeRate, 'USD', true)}`
          ) : (
            <Skeleton width={60} />
          )}
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
              <MaturityLinearProgress maturityDate={maturityDate} />
            ) : (
              <Skeleton sx={{ margin: 'auto' }} width={150} />
            )}
          </Box>
        </TableCell>
        <TableCell align="left" width={50} size="small" sx={{ px: 1 }}>
          {(maturityDate && (
            <Button
              variant="outlined"
              onClick={(e) =>
                handleActionClick(e, type === 'borrow' ? 'repayAtMaturity' : 'withdrawAtMaturity', symbol, maturityDate)
              }
            >
              {type === 'borrow' ? 'Repay' : 'Withdraw'}
            </Button>
          )) || (
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
        <TableCell style={{ padding: 0 }} colSpan={7} size="small">
          <CollapseFixedPool open={open} transactions={transactions} />
        </TableCell>
      </TableRow>
    </>
  );
}

export default TableRowFixedPool;
