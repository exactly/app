import { useContext } from 'react';

import ModalStatusContext from 'contexts/ModalStatusContext';

function Operation() {
  const { operation } = useContext(ModalStatusContext);

  return (
    <>
      {operation == 'deposit' && 'Deposit'}
      {operation == 'borrow' && 'Borrow'}
      {operation == 'withdraw' && 'Withdraw'}
      {operation == 'repay' && 'Repay'}
      {operation == 'depositAtMaturity' && 'depositAtMaturity'}
      {operation == 'borrowAtMaturity' && 'borrowAtMaturity'}
      {operation == 'withdrawAtMaturity' && 'withdrawAtMaturity'}
      {operation == 'repayAtMaturity' && 'repayAtMaturity'}
    </>
  );
}

export default Operation;
