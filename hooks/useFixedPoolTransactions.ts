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
      setBorrowTxs([...getMaturityPoolBorrows.borrowAtMaturities]);

      const getMaturityPoolRepays = await request(
        subgraphUrl,
        getMaturityPoolRepaysQuery(walletAddress, maturity, market.toLowerCase()),
      );
      setRepayTxs([...getMaturityPoolRepays.repayAtMaturities]);
    } else {
      const getMaturityPoolDeposits = await request(
        subgraphUrl,
        getMaturityPoolDepositsQuery(walletAddress, maturity, market.toLowerCase()),
      );
      setDepositTxs([...getMaturityPoolDeposits.depositAtMaturities]);

      const getMaturityPoolWithdraws = await request(
        subgraphUrl,
        getMaturityPoolWithdrawsQuery(walletAddress, maturity, market.toLowerCase()),
      );
      setWithdrawTxs([...getMaturityPoolWithdraws.withdrawAtMaturities]);
    }
  }, [market, maturity, network?.name, type, walletAddress, accountData]);

  useEffect(() => {
    getFixedPoolTransactions();
  }, [getFixedPoolTransactions]);

  return { withdrawTxs, repayTxs, depositTxs, borrowTxs };
};
