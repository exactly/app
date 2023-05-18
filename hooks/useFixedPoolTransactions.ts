import { parseFixed } from '@ethersproject/bignumber';
import request from 'graphql-request';
import { getMaturityPoolBorrowsQuery } from 'queries/getMaturityPoolBorrows';
import { getMaturityPoolDepositsQuery } from 'queries/getMaturityPoolDeposits';
import { getMaturityPoolRepaysQuery } from 'queries/getMaturityPoolRepay';
import { getMaturityPoolWithdrawsQuery } from 'queries/getMaturityPoolWithdraw';
import { useCallback, useEffect, useState } from 'react';
import { Borrow } from 'types/Borrow';
import { Deposit } from 'types/Deposit';
import { Repay } from 'types/Repay';
import { WithdrawMP } from 'types/WithdrawMP';
import { useWeb3 } from './useWeb3';
import networkData from 'config/networkData.json' assert { type: 'json' };
import useAccountData from './useAccountData';
import { useGlobalError } from 'contexts/GlobalErrorContext';

export default (type: 'borrow' | 'deposit', maturity: number, market: string) => {
  const { accountData } = useAccountData();
  const { walletAddress, chain } = useWeb3();
  const [withdrawTxs, setWithdrawTxs] = useState<WithdrawMP[]>([]);
  const [repayTxs, setRepayTxs] = useState<Repay[]>([]);
  const [depositTxs, setDepositTxs] = useState<Deposit[]>([]);
  const [borrowTxs, setBorrowTxs] = useState<Borrow[]>([]);
  const { setIndexerError } = useGlobalError();

  const getFixedPoolTransactions = useCallback(async () => {
    if (!walletAddress || !maturity || !market || !type || !chain || !accountData) return;
    const subgraphUrl = networkData[String(chain.id) as keyof typeof networkData]?.subgraph;
    if (!subgraphUrl) return;

    if (type === 'borrow') {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const getMaturityPoolBorrows = await request<any>(
        subgraphUrl,
        getMaturityPoolBorrowsQuery(walletAddress, maturity, market.toLowerCase()),
      ).catch(() => {
        setIndexerError();
        return undefined;
      });

      const borrows: Borrow[] = [];

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      getMaturityPoolBorrows?.borrowAtMaturities.forEach((borrow: any) => {
        const {
          id,
          market: borrowMarket,
          symbol,
          maturity: borrowMaturity,
          assets,
          fee,
          caller,
          receiver,
          borrower,
          timestamp,
          editable,
        } = borrow;

        borrows.push({
          id,
          market: borrowMarket,
          symbol,
          maturity: parseFloat(borrowMaturity),
          assets: parseFixed(assets),
          fee: parseFixed(fee),
          caller,
          receiver,
          borrower,
          timestamp,
          editable,
        });
      });

      setBorrowTxs(borrows);

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const getMaturityPoolRepays = await request<any>(
        subgraphUrl,
        getMaturityPoolRepaysQuery(walletAddress, maturity, market.toLowerCase()),
      ).catch(() => {
        setIndexerError();
        return undefined;
      });

      const repays: Repay[] = [];

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      getMaturityPoolRepays?.repayAtMaturities.forEach((repay: any) => {
        const {
          id,
          market: repayMarket,
          maturity: repayMaturity,
          caller,
          borrower,
          assets,
          debtCovered,
          timestamp,
        } = repay;

        repays.push({
          id,
          market: repayMarket,
          maturity: parseFloat(repayMaturity),
          caller,
          borrower,
          assets: parseFixed(assets),
          debtCovered: parseFixed(debtCovered),
          timestamp,
        });
      });

      setRepayTxs(repays);
    } else {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const getMaturityPoolDeposits = await request<any>(
        subgraphUrl,
        getMaturityPoolDepositsQuery(walletAddress, maturity, market.toLowerCase()),
      ).catch(() => {
        setIndexerError();
        return undefined;
      });

      const deposits: Deposit[] = [];

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      getMaturityPoolDeposits?.depositAtMaturities.forEach((deposit: any) => {
        const {
          id,
          market: depositMarket,
          symbol,
          maturity: depositMaturity,
          assets,
          fee,
          owner,
          caller,
          timestamp,
          editable,
        } = deposit;

        deposits.push({
          id,
          market: depositMarket,
          symbol,
          maturity: parseFloat(depositMaturity),
          assets: parseFixed(assets),
          fee: parseFixed(fee),
          owner,
          caller,
          timestamp,
          editable,
        });
      });

      setDepositTxs(deposits);

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const getMaturityPoolWithdraws = await request<any>(
        subgraphUrl,
        getMaturityPoolWithdrawsQuery(walletAddress, maturity, market.toLowerCase()),
      ).catch(() => {
        setIndexerError();
        return undefined;
      });

      const withdraws: WithdrawMP[] = [];

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      getMaturityPoolWithdraws?.withdrawAtMaturities.forEach((withdraw: any) => {
        const {
          id,
          assets,
          market: withdrawMarket,
          maturity: withdrawMaturity,
          owner,
          caller,
          positionAssets,
          receiver,
          timestamp,
        } = withdraw;

        withdraws.push({
          id,
          assets: parseFixed(assets),
          market: withdrawMarket,
          maturity: parseFloat(withdrawMaturity),
          owner,
          caller,
          positionAssets: parseFixed(positionAssets),
          receiver,
          timestamp,
        });
      });

      setWithdrawTxs(withdraws);
    }
  }, [walletAddress, maturity, market, type, chain, accountData, setIndexerError]);

  useEffect(() => {
    getFixedPoolTransactions();
  }, [getFixedPoolTransactions]);

  return { withdrawTxs, repayTxs, depositTxs, borrowTxs };
};
