import { parseFixed } from '@ethersproject/bignumber';
import AccountDataContext from 'contexts/AccountDataContext';
import { useWeb3Context } from 'contexts/Web3Context';
import request from 'graphql-request';
import { getMaturityPoolBorrowsQuery } from 'queries/getMaturityPoolBorrows';
import { getMaturityPoolDepositsQuery } from 'queries/getMaturityPoolDeposits';
import { getMaturityPoolRepaysQuery } from 'queries/getMaturityPoolRepay';
import { getMaturityPoolWithdrawsQuery } from 'queries/getMaturityPoolWithdraw';
import { useCallback, useContext, useEffect, useState } from 'react';
import { Borrow } from 'types/Borrow';
import { Deposit } from 'types/Deposit';
import { Repay } from 'types/Repay';
import { WithdrawMP } from 'types/WithdrawMP';
import getSubgraph from 'utils/getSubgraph';

export default (type: 'borrow' | 'deposit', maturity: string, market: string) => {
  const { accountData } = useContext(AccountDataContext);
  const { walletAddress, network } = useWeb3Context();
  const [withdrawTxs, setWithdrawTxs] = useState<WithdrawMP[]>([]);
  const [repayTxs, setRepayTxs] = useState<Repay[]>([]);
  const [depositTxs, setDepositTxs] = useState<Deposit[]>([]);
  const [borrowTxs, setBorrowTxs] = useState<Borrow[]>([]);

  const getFixedPoolTransactions = useCallback(async () => {
    const subgraphUrl = getSubgraph(network?.name);
    if (!walletAddress || !maturity || !market || !type || !subgraphUrl || !accountData) return;

    if (type === 'borrow') {
      const getMaturityPoolBorrows = await request(
        subgraphUrl,
        getMaturityPoolBorrowsQuery(walletAddress, maturity, market.toLowerCase()),
      );

      const borrows: Borrow[] = [];

      getMaturityPoolBorrows.borrowAtMaturities.forEach((borrow: any) => {
        const { id, market, symbol, maturity, assets, fee, caller, receiver, borrower, timestamp, editable } = borrow;

        borrows.push({
          id,
          market,
          symbol,
          maturity: parseFloat(maturity),
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

      const getMaturityPoolRepays = await request(
        subgraphUrl,
        getMaturityPoolRepaysQuery(walletAddress, maturity, market.toLowerCase()),
      );

      const repays: Repay[] = [];

      getMaturityPoolRepays.repayAtMaturities.forEach((repay: any) => {
        const { id, market, maturity, caller, borrower, assets, debtCovered, timestamp } = repay;

        repays.push({
          id,
          market,
          maturity: parseFloat(maturity),
          caller,
          borrower,
          assets: parseFixed(assets),
          debtCovered: parseFixed(debtCovered),
          timestamp,
        });
      });

      setRepayTxs(repays);
    } else {
      const getMaturityPoolDeposits = await request(
        subgraphUrl,
        getMaturityPoolDepositsQuery(walletAddress, maturity, market.toLowerCase()),
      );

      const deposits: Deposit[] = [];

      getMaturityPoolDeposits.depositAtMaturities.forEach((deposit: any) => {
        const { id, market, symbol, maturity, assets, fee, owner, caller, timestamp, editable } = deposit;

        deposits.push({
          id,
          market,
          symbol,
          maturity: parseFloat(maturity),
          assets: parseFixed(assets),
          fee: parseFixed(fee),
          owner,
          caller,
          timestamp,
          editable,
        });
      });

      setDepositTxs(deposits);

      const getMaturityPoolWithdraws = await request(
        subgraphUrl,
        getMaturityPoolWithdrawsQuery(walletAddress, maturity, market.toLowerCase()),
      );

      const withdraws: WithdrawMP[] = [];

      getMaturityPoolWithdraws.withdrawAtMaturities.forEach((withdraw: any) => {
        const { id, assets, market, maturity, owner, caller, positionAssets, receiver, timestamp } = withdraw;

        withdraws.push({
          id,
          assets: parseFixed(assets),
          market,
          maturity: parseFloat(maturity),
          owner,
          caller,
          positionAssets: parseFixed(positionAssets),
          receiver,
          timestamp,
        });
      });

      setWithdrawTxs(withdraws);
    }
  }, [market, maturity, network?.name, type, walletAddress, accountData]);

  useEffect(() => {
    getFixedPoolTransactions();
  }, [getFixedPoolTransactions]);

  return { withdrawTxs, repayTxs, depositTxs, borrowTxs };
};
