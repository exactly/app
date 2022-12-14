import React from 'react';

import Deposit from 'components/operations/Deposit';
import Borrow from 'components/operations/Borrow';
import Withdraw from 'components/operations/Withdraw';
import Repay from 'components/operations/Repay';
import DepositAtMaturity from 'components/operations/DepositAtMaturity';
import BorrowAtMaturity from 'components/operations/BorrowAtMaturity';
import WithdrawAtMaturity from 'components/operations/WithdrawAtMaturity';
import RepayAtMaturity from 'components/operations/RepayAtMaturity';
import Faucet from 'components/operations/Faucet';

import styles from './style.module.scss';

import { useModalStatus } from 'contexts/ModalStatusContext';
import { OperationContextProvider } from 'contexts/OperationContext';

function OperationContainer() {
  const { operation } = useModalStatus();

  return (
    <OperationContextProvider>
      <section className={styles.operationContainer}>
        {operation === 'deposit' && <Deposit />}
        {operation === 'borrow' && <Borrow />}
        {operation === 'withdraw' && <Withdraw />}
        {operation === 'repay' && <Repay />}
        {operation === 'depositAtMaturity' && <DepositAtMaturity />}
        {operation === 'borrowAtMaturity' && <BorrowAtMaturity />}
        {operation === 'withdrawAtMaturity' && <WithdrawAtMaturity />}
        {operation === 'repayAtMaturity' && <RepayAtMaturity />}
        {operation === 'faucet' && <Faucet />}
      </section>
    </OperationContextProvider>
  );
}

export default OperationContainer;
