import React from 'react';
import dynamic from 'next/dynamic';

const Deposit = dynamic(() => import('components/operations/Deposit'));
const Borrow = dynamic(() => import('components/operations/Borrow'));
const Withdraw = dynamic(() => import('components/operations/Withdraw'));
const Repay = dynamic(() => import('components/operations/Repay'));
const DepositAtMaturity = dynamic(() => import('components/operations/DepositAtMaturity'));
const BorrowAtMaturity = dynamic(() => import('components/operations/BorrowAtMaturity'));
const WithdrawAtMaturity = dynamic(() => import('components/operations/WithdrawAtMaturity'));
const RepayAtMaturity = dynamic(() => import('components/operations/RepayAtMaturity'));
const Faucet = dynamic(() => import('components/operations/Faucet'));

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
