import { useContext, useEffect, useState } from 'react';
import { ethers } from 'ethers';
import request from 'graphql-request';

import Button from 'components/common/Button';
import Skeleton from 'react-loading-skeleton';

import LangContext from 'contexts/LangContext';
import { useWeb3Context } from 'contexts/Web3Context';
import AccountDataContext from 'contexts/AccountDataContext';

import { LangKeys } from 'types/Lang';
import { Deposit } from 'types/Deposit';
import { Borrow } from 'types/Borrow';
import { WithdrawMP } from 'types/WithdrawMP';
import { Repay } from 'types/Repay';
import { Option } from 'react-dropdown';

import styles from './style.module.scss';

import keys from './translations.json';

import parseTimestamp from 'utils/parseTimestamp';
import parseSymbol from 'utils/parseSymbol';
import getSubgraph from 'utils/getSubgraph';
import formatNumber from 'utils/formatNumber';

import {
  getMaturityPoolBorrowsQuery,
  getMaturityPoolDepositsQuery,
  getMaturityPoolWithdrawsQuery,
  getMaturityPoolRepaysQuery
} from 'queries';

type Props = {
  type?: Option | undefined;
  amount: string | undefined;
  fee: string | undefined;
  maturityDate: string | undefined;
  showModal: (data: Deposit | Borrow, type: String) => void;
  symbol: string | undefined;
  market: string | undefined;
  decimals: number | undefined;
  data: Borrow | Deposit | undefined;
};

function Item({
  type,
  amount,
  fee,
  maturityDate,
  showModal,
  symbol,
  market,
  decimals,
  data
}: Props) {
  const { network, walletAddress } = useWeb3Context();

  const { accountData } = useContext(AccountDataContext);

  const lang: string = useContext(LangContext);
  const translations: { [key: string]: LangKeys } = keys;

  const [transactions, setTransactions] = useState<Array<WithdrawMP | Repay | Deposit | Borrow>>(
    []
  );
  const [exchangeRate, setExchangeRate] = useState<number | undefined>(undefined);
  const [APY, setAPY] = useState<number | undefined>(undefined);

  useEffect(() => {
    getMaturityData();
    getRate();
  }, [maturityDate, walletAddress, accountData]);

  useEffect(() => {
    getAPY();
  }, [walletAddress, accountData]);

  async function getMaturityData() {
    if (!walletAddress || !maturityDate || !market || !type) return;

    const subgraphUrl = getSubgraph(network?.name);
    const transactions = [];

    if (type?.value === 'borrow') {
      const getMaturityPoolBorrows = await request(
        subgraphUrl,
        getMaturityPoolBorrowsQuery(walletAddress!, maturityDate, market.toLowerCase())
      );

      transactions.push(...getMaturityPoolBorrows.borrowAtMaturities);

      const getMaturityPoolRepays = await request(
        subgraphUrl,
        getMaturityPoolRepaysQuery(walletAddress!, maturityDate, market.toLowerCase())
      );

      transactions.push(...getMaturityPoolRepays.repayAtMaturities);
    } else {
      const getMaturityPoolDeposits = await request(
        subgraphUrl,
        getMaturityPoolDepositsQuery(walletAddress!, maturityDate, market.toLowerCase())
      );

      transactions.push(...getMaturityPoolDeposits.depositAtMaturities);

      const getMaturityPoolWithdraws = await request(
        subgraphUrl,
        getMaturityPoolWithdrawsQuery(walletAddress!, maturityDate, market.toLowerCase())
      );

      transactions.push(...getMaturityPoolWithdraws.withdrawAtMaturities);
    }
    setTransactions(transactions.sort((a, b) => b.timestamp - a.timestamp));
  }

  async function getRate() {
    if (!symbol || !accountData) return;

    const rate = parseFloat(ethers.utils.formatEther(accountData[symbol].oraclePrice));

    setExchangeRate(rate);
  }

  async function getAPY() {
    if (!walletAddress || !maturityDate || !market || !type || !network) return;

    const subgraphUrl = getSubgraph(network.name);
    const allTransactions = [];
    let allAPYbyAmount = 0;
    let allAmounts = 0;

    if (type?.value === 'borrow') {
      const getMaturityPoolBorrows = await request(
        subgraphUrl,
        getMaturityPoolBorrowsQuery(walletAddress, maturityDate, market.toLowerCase())
      );

      allTransactions.push(...getMaturityPoolBorrows.borrowAtMaturities);
    } else {
      const getMaturityPoolDeposits = await request(
        subgraphUrl,
        getMaturityPoolDepositsQuery(walletAddress, maturityDate, market.toLowerCase())
      );

      allTransactions.push(...getMaturityPoolDeposits.depositAtMaturities);
    }

    allTransactions.forEach((transaction) => {
      const transactionFee = parseFloat(ethers.utils.formatUnits(transaction.fee, decimals));
      const transactionAmount = parseFloat(ethers.utils.formatUnits(transaction.assets, decimals));
      const transactionRate = transactionFee / transactionAmount;
      const transactionTimestamp = parseFloat(transaction.timestamp);
      const transactionMaturity = parseFloat(transaction.maturity);
      const time = 31536000 / (transactionMaturity - transactionTimestamp);

      const transactionAPY = (Math.pow(1 + transactionRate, time) - 1) * 100;

      allAPYbyAmount += transactionAPY * transactionAmount;
      allAmounts += transactionAmount;
    });

    const averageAPY = allAPYbyAmount / allAmounts;

    setAPY(averageAPY);
  }

  return (
    <details className={styles.container}>
      <summary className={styles.summary}>
        <div className={styles.symbol}>
          {(symbol && (
            <img
              src={`/img/assets/${symbol?.toLowerCase()}.png`}
              alt={symbol}
              className={styles.assetImage}
            />
          )) || <Skeleton circle height={40} width={40} />}
          <span className={styles.primary}>{symbol ? parseSymbol(symbol) : <Skeleton />}</span>
        </div>
        <span className={styles.value}>
          {symbol && exchangeRate && amount ? (
            `$${formatNumber(
              parseFloat(ethers.utils.formatUnits(amount, decimals)) * exchangeRate,
              'USD',
              true
            )}`
          ) : (
            <Skeleton width={40} />
          )}
        </span>
        <span className={styles.value}>
          {APY != undefined ? `${(APY || 0).toFixed(2)} %` : <Skeleton width={40} />}
        </span>

        {type && data ? (
          <div className={styles.buttonContainer}>
            <Button
              text={type.value == 'borrow' ? translations[lang].repay : translations[lang].withdraw}
              className={type.value == 'borrow' ? 'quaternary' : 'tertiary'}
              onClick={() => {
                showModal(data, type.value == 'borrow' ? 'repay' : 'withdraw');
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
              const value = symbol && ethers.utils.formatUnits(transaction.assets, decimals);

              const text = transaction?.fee
                ? type?.value == 'borrow'
                  ? translations[lang].borrow
                  : translations[lang].deposit
                : type?.value == 'borrow'
                ? translations[lang].repay
                : translations[lang].withdraw;

              const isEnter = text.toLowerCase() == 'borrow' || text.toLowerCase() == 'deposit';

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
                      <span className={styles.usd}>
                        (${(parseFloat(value) * exchangeRate).toFixed(2)})
                      </span>
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
