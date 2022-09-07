import { useContext } from 'react';
import dynamic from 'next/dynamic';

const BorrowModal = dynamic(() => import('components/BorrowModal'));
const DepositModalMP = dynamic(() => import('components/DepositModalMP'));
const DepositModalSP = dynamic(() => import('components/DepositModalSP'));
const FaucetModal = dynamic(() => import('components/FaucetModal'));
const FloatingBorrowModal = dynamic(() => import('components/FloatingBorrowModal'));
const FloatingRepayModal = dynamic(() => import('components/FloatingRepayModal'));
const RepayModal = dynamic(() => import('components/RepayModal'));
const WithdrawModalMP = dynamic(() => import('components/WithdrawModalMP'));
const WithdrawModalSP = dynamic(() => import('components/WithdrawModalSP'));

import ModalStatusContext from 'contexts/ModalStatusContext';

function ModalsContainer() {
  const { open, modalContent, setOpen } = useContext(ModalStatusContext);

  return (
    <>
      {open && modalContent?.type == 'faucet' && <FaucetModal closeModal={() => setOpen(false)} />}

      {open && modalContent?.type == 'floatingBorrow' && (
        <FloatingBorrowModal data={modalContent} closeModal={() => setOpen(false)} />
      )}

      {open && modalContent?.type == 'floatingRepay' && (
        <FloatingRepayModal data={modalContent} closeModal={() => setOpen(false)} />
      )}

      {open && modalContent?.type == 'borrow' && (
        <BorrowModal data={modalContent} closeModal={() => setOpen(false)} />
      )}

      {open && modalContent?.type == 'repay' && (
        <RepayModal data={modalContent} closeModal={() => setOpen(false)} />
      )}

      {open && modalContent?.type == 'deposit' && (
        <DepositModalMP data={modalContent} closeModal={() => setOpen(false)} />
      )}

      {open && modalContent?.type == 'withdraw' && (
        <WithdrawModalMP data={modalContent} closeModal={() => setOpen(false)} />
      )}

      {open && modalContent?.type == 'smartDeposit' && (
        <DepositModalSP data={modalContent} closeModal={() => setOpen(false)} />
      )}

      {open && modalContent?.type == 'withdrawSP' && (
        <WithdrawModalSP data={modalContent} closeModal={() => setOpen(false)} />
      )}
    </>
  );
}

export default ModalsContainer;
