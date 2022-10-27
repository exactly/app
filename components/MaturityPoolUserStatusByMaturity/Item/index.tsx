import type { BigNumber } from '@ethersproject/bignumber';
import { formatFixed } from '@ethersproject/bignumber';
import { useContext, useEffect, useState } from 'react';
import request from 'graphql-request';
import Image from 'next/image';

import Button from 'components/common/Button';

import Skeleton from 'react-loading-skeleton';

import LangContext from 'contexts/LangContext';
import { useWeb3Context } from 'contexts/Web3Context';
import AccountDataContext from 'contexts/AccountDataContext';
import ModalStatusContext from 'contexts/ModalStatusContext';
import { MarketContext } from 'contexts/MarketContext';

import { LangKeys } from 'types/Lang';
import { Deposit } from 'types/Deposit';
import { Borrow } from 'types/Borrow';
import { WithdrawMP } from 'types/WithdrawMP';
import { Repay } from 'types/Repay';
import { Option } from 'react-dropdown';

import styles from './style.module.scss';

import keys from './translations.json';

import parseTimestamp from 'utils/parseTimestamp';
import formatSymbol from 'utils/formatSymbol';
import getSubgraph from 'utils/getSubgraph';
import formatNumber from 'utils/formatNumber';
import getDaysRemaining from 'utils/getDaysRemaining';

import {
  getMaturityPoolBorrowsQuery,
  getMaturityPoolDepositsQuery,
  getMaturityPoolWithdrawsQuery,
  getMaturityPoolRepaysQuery,
} from 'queries';

type Props = {
  type?: Option | undefined;
  amount: BigNumber | undefined;
  fee: BigNumber | undefined;
  maturityDate: string | undefined;
  symbol: string | undefined;
  market: string | undefined;
  decimals: number | undefined;
  data: Borrow | Deposit | undefined;
  progress: number | undefined;
};

function Item({ type, amount, maturityDate, symbol, market, progress, decimals, data }: Props) {
  const { network, walletAddress } = useWeb3Context();

  const { accountData } = useContext(AccountDataContext);
  const { setOpen, setOperation } = useContext(ModalStatusContext);
  const { setMarket, setDate } = useContext(MarketContext);

  const lang: string = useContext(LangContext);
  const translations: { [key: string]: LangKeys } = keys;

  const [transactions, setTransactions] = useState<Array<WithdrawMP | Repay | Deposit | Borrow>>([]);
  const [exchangeRate, setExchangeRate] = useState<number | undefined>(undefined);
  const [, setDaysRemaining] = useState<string | undefined>(undefined);
  const [APR, setAPR] = useState<number | undefined>(undefined);

  useEffect(() => {
    getMaturityData();
    getRate();
    getDays();
  }, [maturityDate, walletAddress, accountData]);

  useEffect(() => {
    getAPR();
  }, [walletAddress, accountData]);

  async function getMaturityData() {
    if (!walletAddress || !maturityDate || !market || !type) return;

    const subgraphUrl = getSubgraph(network?.name);
    const transactions = [];

    if (type?.value === 'borrow') {
      const getMaturityPoolBorrows = await request(
        subgraphUrl,
        getMaturityPoolBorrowsQuery(walletAddress!, maturityDate, market.toLowerCase()),
      );

      transactions.push(...getMaturityPoolBorrows.borrowAtMaturities);

      const getMaturityPoolRepays = await request(
        subgraphUrl,
        getMaturityPoolRepaysQuery(walletAddress!, maturityDate, market.toLowerCase()),
      );

      transactions.push(...getMaturityPoolRepays.repayAtMaturities);
    } else {
      const getMaturityPoolDeposits = await request(
        subgraphUrl,
        getMaturityPoolDepositsQuery(walletAddress!, maturityDate, market.toLowerCase()),
      );

      transactions.push(...getMaturityPoolDeposits.depositAtMaturities);

      const getMaturityPoolWithdraws = await request(
        subgraphUrl,
        getMaturityPoolWithdrawsQuery(walletAddress!, maturityDate, market.toLowerCase()),
      );

      transactions.push(...getMaturityPoolWithdraws.withdrawAtMaturities);
    }
    setTransactions(transactions.sort((a, b) => b.timestamp - a.timestamp));
  }

  async function getRate() {
    if (!symbol || !accountData) return;

    const rate = parseFloat(formatFixed(accountData[symbol].usdPrice, 18));

    setExchangeRate(rate);
  }

  async function getAPR() {
    if (!walletAddress || !maturityDate || !market || !type || !network) return;

    const subgraphUrl = getSubgraph(network.name);
    const allTransactions = [];
    let allAPRbyAmount = 0;
    let allAmounts = 0;

    if (type?.value === 'borrow') {
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
  }

  function getDays() {
    if (!maturityDate) return;

    const days = getDaysRemaining(Number(maturityDate));
    setDaysRemaining(days);
  }

  return (
    <details className={styles.container}>
      <summary className={styles.summary}>
        <div className={styles.symbol}>
          {(symbol && <Image src={`/img/assets/${symbol}.svg`} alt={symbol} width={20} height={20} />) || (
            <Skeleton circle height={20} width={20} />
          )}
          <span className={styles.primary}>{symbol ? formatSymbol(symbol) : <Skeleton />}</span>
        </div>
        <span className={styles.value}>
          {symbol && exchangeRate && amount ? (
            `$${formatNumber(parseFloat(formatFixed(amount, decimals)) * exchangeRate, 'USD', true)}`
          ) : (
            <Skeleton width={40} />
          )}
        </span>
        <span className={styles.value}>{APR != null ? `${(APR || 0).toFixed(2)} %` : <Skeleton width={40} />}</span>

        <span className={styles.value}>{maturityDate && parseTimestamp(maturityDate)}</span>

        <span className={styles.value}>
          <div className={styles.line}>
            {progress && progress >= 100 ? (
              <div className={styles.fullProgress} style={{ width: `100%` }} />
            ) : (
              <div className={styles.progress} style={{ width: `${progress?.toString()}%` }} />
            )}
          </div>
        </span>
        {type && data ? (
          <div className={styles.buttonContainer}>
            <Button
              text={type.value === 'borrow' ? translations[lang].repay : translations[lang].withdraw}
              className={'tertiary'}
              onClick={() => {
                setDate({ value: maturityDate!, label: parseTimestamp(maturityDate!) });
                setMarket({ value: market! });
                setOperation(type.value === 'borrow' ? 'repayAtMaturity' : 'withdrawAtMaturity');
                setOpen(true);
              }}
            />
          </div>
        ) : (
          <Skeleton className={styles.buttonContainer} />
        )}
      </summary>
      <div className={styles.tableContainer}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th scope="col">Date</th>
              <th scope="col">Operation</th>
              <th scope="col">Amount</th>
            </tr>
          </thead>
          <tbody>
            {transactions.map((transaction: any, key) => {
              const value = symbol && formatFixed(transaction.assets, decimals);

              const text = transaction?.fee
                ? type?.value === 'borrow'
                  ? translations[lang].borrow
                  : translations[lang].deposit
                : type?.value === 'borrow'
                ? translations[lang].repay
                : translations[lang].withdraw;

              const isEnter = text.toLowerCase() === 'borrow' || text.toLowerCase() === 'deposit';

              return (
                <tr key={key}>
                  <td>{parseTimestamp(transaction?.timestamp || '0')}</td>
                  <td>
                    <span
                      className={styles.arrow}
                      style={isEnter ? { color: `var(--success)` } : { color: `var(--error)` }}
                    >
                      {isEnter ? '↓' : '↑'}
                    </span>{' '}
                    {text}
                  </td>
                  <td>
                    {value}{' '}
                    {exchangeRate && value && (
                      <span className={styles.usd}>(${(parseFloat(value) * exchangeRate).toFixed(2)})</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </details>
  );
}

export default Item;
