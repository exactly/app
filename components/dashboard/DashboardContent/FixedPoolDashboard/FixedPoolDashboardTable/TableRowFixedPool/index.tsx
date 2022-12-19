import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { BigNumber, formatFixed } from '@ethersproject/bignumber';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import { Box, Button, IconButton, Skeleton, Stack, TableCell, TableRow, Typography } from '@mui/material';
import MaturityLinearProgress from 'components/common/MaturityLinearProgress';
import AccountDataContext from 'contexts/AccountDataContext';
import { MarketContext } from 'contexts/MarketContext';
import useFixedOperation from 'hooks/useFixedPoolTransactions';

import React, { useContext, useMemo, useState } from 'react';
import { FixedPoolTransaction } from 'types/FixedPoolTransaction';
import calculateAPR from 'utils/calculateAPR';
import formatNumber from 'utils/formatNumber';
import formatSymbol from 'utils/formatSymbol';
import parseTimestamp from 'utils/parseTimestamp';
import CollapseFixedPool from '../CollapseFixedPool';
import { useModalStatus } from 'contexts/ModalStatusContext';
import APRItem from '../APRItem';

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
  const { openOperationModal } = useModalStatus();
  const { setMarket, setDate } = useContext(MarketContext);
  const { withdrawTxs, repayTxs, depositTxs, borrowTxs } = useFixedOperation(type, maturityDate, market);
  const [open, setOpen] = useState(false);
  const { query } = useRouter();

  const exchangeRate: number | undefined = useMemo(() => {
    if (!symbol || !accountData) return;
    const rate = parseFloat(formatFixed(accountData[symbol].usdPrice, 18));
    return rate;
  }, [accountData, symbol]);

  const transactions: FixedPoolTransaction[] = useMemo(() => {
    const allTransactions = [...withdrawTxs, ...repayTxs, ...depositTxs, ...borrowTxs].sort(
      (a, b) => parseInt(b.timestamp) - parseInt(a.timestamp),
    );

    if (!allTransactions || !exchangeRate) return [];
    const transformedTxs = allTransactions.map((transaction: any) => {
      const assets = symbol && formatFixed(transaction.assets, decimals);

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
  }, [withdrawTxs, repayTxs, depositTxs, borrowTxs, type, exchangeRate, decimals, symbol]);

  return (
    <React.Fragment>
      <TableRow sx={{ '& > *': { borderBottom: 'unset' }, backgroundColor: open ? 'grey.50' : 'transparent' }} hover>
        <Link href={{ pathname: `/assets/${symbol}`, query }}>
          <TableCell component="th" align="left" sx={{ cursor: 'pointer' }} width={240}>
            <Stack direction="row" spacing={1}>
              {(symbol && <Image src={`/img/assets/${symbol}.svg`} alt={symbol} width={24} height={24} />) || (
                <Skeleton sx={{ margin: 'auto' }} variant="circular" height={24} width={24} />
              )}
              <Typography fontWeight="600" ml={1} display="inline" alignSelf="center">
                {(symbol && formatSymbol(symbol)) || <Skeleton sx={{ margin: 'auto' }} />}
              </Typography>
            </Stack>
          </TableCell>
        </Link>
        <TableCell align="left" size="small">
          {symbol && exchangeRate && amount ? (
            `$${formatNumber(parseFloat(formatFixed(amount, decimals)) * exchangeRate, 'USD', true)}`
          ) : (
            <Skeleton sx={{ margin: 'auto' }} width={50} />
          )}
        </TableCell>
        <TableCell align="left" size="small">
          <APRItem type={type} maturityDate={maturityDate} market={market} decimals={decimals} />
        </TableCell>
        <TableCell align="left" size="small">
          {maturityDate ? parseTimestamp(maturityDate) : <Skeleton sx={{ margin: 'auto' }} width={80} />}
        </TableCell>
        <TableCell align="left" size="small" width={200}>
          <Box width={150}>
            {maturityDate ? (
              <MaturityLinearProgress maturityDate={maturityDate} />
            ) : (
              <Skeleton sx={{ margin: 'auto' }} width={130} />
            )}
          </Box>
        </TableCell>
        <TableCell align="left" width={50} size="small" sx={{ px: 1 }}>
          {(symbol && maturityDate && (
            <Button
              variant="outlined"
              onClick={() => {
                setDate({ value: maturityDate, label: parseTimestamp(maturityDate) });
                setMarket({ value: market });
                openOperationModal(type === 'borrow' ? 'repayAtMaturity' : 'withdrawAtMaturity');
              }}
            >
              {type === 'borrow' ? 'Repay' : 'Withdraw'}
            </Button>
          )) || <Skeleton sx={{ margin: 'auto' }} height={40} width={70} />}
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
    </React.Fragment>
  );
}

export default TableRowFixedPool;
