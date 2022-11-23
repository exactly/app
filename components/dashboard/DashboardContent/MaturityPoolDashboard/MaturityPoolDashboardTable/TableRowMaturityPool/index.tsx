import { BigNumber, formatFixed } from '@ethersproject/bignumber';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import { Button, IconButton, Skeleton, Stack, TableCell, TableRow, Typography } from '@mui/material';
import AccountDataContext from 'contexts/AccountDataContext';
import { MarketContext } from 'contexts/MarketContext';
import ModalStatusContext from 'contexts/ModalStatusContext';
import { useWeb3Context } from 'contexts/Web3Context';
import request from 'graphql-request';
import Image from 'next/image';
import Link from 'next/link';
import {
  getMaturityPoolBorrowsQuery,
  getMaturityPoolDepositsQuery,
  getMaturityPoolRepaysQuery,
  getMaturityPoolWithdrawsQuery,
} from 'queries';
import React, { useCallback, useContext, useEffect, useMemo, useState } from 'react';
import formatNumber from 'utils/formatNumber';
import formatSymbol from 'utils/formatSymbol';
import getSubgraph from 'utils/getSubgraph';
import parseTimestamp from 'utils/parseTimestamp';
import CollapseMaturityPool from '../CollapseMaturityPool';

type Props = {
  symbol: string;
  amount: BigNumber;
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

function TableRowMaturityPool({ symbol, amount, type, maturityDate, market, decimals }: Props) {
  const { network, walletAddress } = useWeb3Context();
  const { accountData } = useContext(AccountDataContext);
  const { setOpen: openOperationModal, setOperation } = useContext(ModalStatusContext);
  const { setMarket, setDate } = useContext(MarketContext);

  const [open, setOpen] = useState(false);
  // const [transactions, setTransactions] = useState<Array<WithdrawMP | Repay | Deposit | Borrow>>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [exchangeRate, setExchangeRate] = useState<number | undefined>();
  const [APR, setAPR] = useState<number | undefined>();

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

        const txType = transaction?.fee
          ? type === 'borrow'
            ? 'Borrow'
            : 'Deposit'
          : type === 'borrow'
          ? 'Repay'
          : 'Withdraw';

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

  const getAPR = useCallback(async () => {
    if (!walletAddress || !maturityDate || !market || !type || !network) return;

    const subgraphUrl = getSubgraph(network.name);
    const allTransactions = [];
    let allAPRbyAmount = 0;
    let allAmounts = 0;

    if (type === 'borrow') {
      const getMaturityPoolBorrows = await request(
        subgraphUrl,
        getMaturityPoolBorrowsQuery(walletAddress, maturityDate, market.toLowerCase()),
      );

      allTransactions.push(...getMaturityPoolBorrows.borrowAtMaturities);
    } else {
      const getMaturityPoolDeposits = await request(
        subgraphUrl,
        getMaturityPoolDepositsQuery(walletAddress, maturityDate, market.toLowerCase()),
      );

      allTransactions.push(...getMaturityPoolDeposits.depositAtMaturities);
    }

    allTransactions.forEach((transaction) => {
      const transactionFee = parseFloat(formatFixed(transaction.fee, decimals));
      const transactionAmount = parseFloat(formatFixed(transaction.assets, decimals));
      const transactionRate = transactionFee / transactionAmount;
      const transactionTimestamp = parseFloat(transaction.timestamp);
      const transactionMaturity = parseFloat(transaction.maturity);
      const time = 31536000 / (transactionMaturity - transactionTimestamp);

      const transactionAPR = transactionRate * time * 100;

      allAPRbyAmount += transactionAPR * transactionAmount;
      allAmounts += transactionAmount;
    });

    const averageAPR = allAPRbyAmount / allAmounts;

    setAPR(averageAPR);
  }, [decimals, market, maturityDate, network, type, walletAddress]);

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

  const progress = useMemo(() => {
    const oneHour = 3600;
    const oneDay = oneHour * 24;
    const maturityLife = oneDay * 7 * 12;
    const nowInSeconds = Date.now() / 1000;
    const startDate = parseInt(maturityDate) - maturityLife;
    const current = nowInSeconds - startDate;
    return (current * 100) / maturityLife;
  }, [maturityDate]);

  useEffect(() => {
    getRate();
    getMaturityData();
  }, [maturityDate, walletAddress, accountData, getMaturityData, getRate]);

  useEffect(() => {
    getAPR();
  }, [walletAddress, accountData, getAPR]);

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
        {/* TODO: add skeleton */}
        <TableCell align="center">
          {symbol && exchangeRate && amount ? (
            `$${formatNumber(parseFloat(formatFixed(amount, decimals)) * exchangeRate, 'USD', true)}`
          ) : (
            <Skeleton width={40} />
          )}
        </TableCell>
        <TableCell align="center">{`${(APR || 0).toFixed(2)} %`}</TableCell>
        <TableCell align="center">{maturityDate && parseTimestamp(maturityDate)}</TableCell>
        <TableCell align="center">{progress}</TableCell>
        <TableCell align="center" width={50} size="small">
          {(symbol && maturityDate && (
            <Button
              variant="contained"
              onClick={() => {
                setDate({ value: maturityDate!, label: parseTimestamp(maturityDate!) });
                setMarket({ value: market! });
                setOperation(type === 'borrow' ? 'repayAtMaturity' : 'withdrawAtMaturity');
                openOperationModal(true);
              }}
            >
              {type === 'borrow' ? 'Repay' : 'Withdraw'}
            </Button>
          )) || <Skeleton sx={{ margin: 'auto' }} height={40} />}
        </TableCell>
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
