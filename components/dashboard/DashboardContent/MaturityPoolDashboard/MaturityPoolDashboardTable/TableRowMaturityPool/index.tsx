import React, { useCallback, useContext, useEffect, useState } from 'react';
import { IconButton, Skeleton, Stack, TableCell, TableRow, Typography } from '@mui/material';
import request from 'graphql-request';
import Link from 'next/link';
import Image from 'next/image';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import CollapseMaturityPool from '../CollapseMaturityPool';
import formatSymbol from 'utils/formatSymbol';
import { Deposit } from 'types/Deposit';
import { WithdrawMP } from 'types/WithdrawMP';
import { useWeb3Context } from 'contexts/Web3Context';
import { Repay } from 'types/Repay';
import { Borrow } from 'types/Borrow';
import getSubgraph from 'utils/getSubgraph';

import {
  getMaturityPoolBorrowsQuery,
  getMaturityPoolDepositsQuery,
  getMaturityPoolWithdrawsQuery,
  getMaturityPoolRepaysQuery,
} from 'queries';
import AccountDataContext from 'contexts/AccountDataContext';
import { formatFixed } from '@ethersproject/bignumber';
import parseTimestamp from 'utils/parseTimestamp';

type Props = {
  symbol: string;
  type: 'deposit' | 'borrow';
  maturityDate: string;
  market: string;
  decimals: number;
};

type Transaction = {
  id: string;
  type: string;
  date: string;
  amount: string;
  amountUSD: string;
  isBorrowOrDeposit: boolean;
};

function TableRowMaturityPool({ symbol, type, maturityDate, market, decimals }: Props) {
  const { network, walletAddress } = useWeb3Context();
  const { accountData } = useContext(AccountDataContext);

  const [open, setOpen] = useState(false);
  // const [transactions, setTransactions] = useState<Array<WithdrawMP | Repay | Deposit | Borrow>>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [exchangeRate, setExchangeRate] = useState<number | undefined>();

  const getRate = useCallback(() => {
    if (!symbol || !accountData) return;
    const rate = parseFloat(formatFixed(accountData[symbol].usdPrice, 18));

    setExchangeRate(rate);
  }, [accountData, symbol]);

  const getMaturityData = useCallback(async () => {
    if (!walletAddress || !maturityDate || !market || !type || !exchangeRate) return;

    const subgraphUrl = getSubgraph(network?.name);
    const txs = [];

    if (type === 'borrow') {
      const getMaturityPoolBorrows = await request(
        subgraphUrl,
        getMaturityPoolBorrowsQuery(walletAddress, maturityDate, market.toLowerCase()),
      );

      txs.push(...getMaturityPoolBorrows.borrowAtMaturities);

      const getMaturityPoolRepays = await request(
        subgraphUrl,
        getMaturityPoolRepaysQuery(walletAddress, maturityDate, market.toLowerCase()),
      );

      txs.push(...getMaturityPoolRepays.repayAtMaturities);
    } else {
      const getMaturityPoolDeposits = await request(
        subgraphUrl,
        getMaturityPoolDepositsQuery(walletAddress, maturityDate, market.toLowerCase()),
      );

      txs.push(...getMaturityPoolDeposits.depositAtMaturities);

      const getMaturityPoolWithdraws = await request(
        subgraphUrl,
        getMaturityPoolWithdrawsQuery(walletAddress, maturityDate, market.toLowerCase()),
      );

      txs.push(...getMaturityPoolWithdraws.withdrawAtMaturities);
    }

    const transformedTxs = txs
      .sort((a, b) => b.timestamp - a.timestamp)
      .map((transaction: any) => {
        const amount = symbol && formatFixed(transaction.assets, decimals);

        // const text = transaction?.fee
        //   ? type === 'borrow'
        //     ? translations[lang].borrow
        //     : translations[lang].deposit
        //   : type?.value === 'borrow'
        //   ? translations[lang].repay
        //   : translations[lang].withdraw;

        const txType = 'Deposit';
        const isBorrowOrDeposit = txType.toLowerCase() === 'borrow' || txType.toLowerCase() === 'deposit';
        const date = parseTimestamp(transaction?.timestamp || '0');
        const amountUSD = (parseFloat(amount) * exchangeRate).toFixed(2);

        return {
          id: transaction.id,
          type: txType,
          date,
          amount,
          amountUSD,
          isBorrowOrDeposit,
        };
      });

    console.log({ transformedTxs });
    setTransactions(transformedTxs);

    // setTransactions(txs.sort((a, b) => b.timestamp - a.timestamp));
  }, [market, maturityDate, network?.name, type, walletAddress, exchangeRate, decimals, symbol]);

  // const transformTransactions = useCallback(() => {
  //   if (!exchangeRate) return [];

  //   return transactions.map((transaction: any) => {
  //     const value = symbol && formatFixed(transaction.assets, decimals);

  //     // const text = transaction?.fee
  //     //   ? type === 'borrow'
  //     //     ? translations[lang].borrow
  //     //     : translations[lang].deposit
  //     //   : type?.value === 'borrow'
  //     //   ? translations[lang].repay
  //     //   : translations[lang].withdraw;

  //     const txType = '';
  //     const isBorrowOrDeposit = txType.toLowerCase() === 'borrow' || txType.toLowerCase() === 'deposit';
  //     const date = parseTimestamp(transaction?.timestamp || '0');
  //     const amount = (parseFloat(value) * exchangeRate).toFixed(2);
  //     return {
  //       id: transaction.id,
  //       type: txType,
  //       date,
  //       amount,
  //       isBorrowOrDeposit,
  //     };
  //   });
  // }, [decimals, symbol, exchangeRate, transactions]);

  useEffect(() => {
    getRate();
    getMaturityData();
  }, [maturityDate, walletAddress, accountData, getMaturityData, getRate]);

  return (
    <React.Fragment>
      <TableRow sx={{ '& > *': { borderBottom: 'unset' } }} hover>
        <Link href={`/assets/${symbol}`}>
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
        {/* <TableCell align="center">{row.calories}</TableCell> */}
        <TableCell align="center">
          <IconButton aria-label="expand row" size="small" onClick={() => setOpen(!open)}>
            {open ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />}
          </IconButton>
        </TableCell>
      </TableRow>
      <TableRow>
        <TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={6}>
          <CollapseMaturityPool open={open} transactions={transactions} />
        </TableCell>
      </TableRow>
    </React.Fragment>
  );
}

export default TableRowMaturityPool;
