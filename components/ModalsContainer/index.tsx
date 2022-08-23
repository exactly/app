import { useContext } from 'react';

import BorrowModal from 'components/BorrowModal';
import DepositModalMP from 'components/DepositModalMP';
import DepositModalSP from 'components/DepositModalSP';
import FaucetModal from 'components/FaucetModal';
import FloatingBorrowModal from 'components/FloatingBorrowModal';
import FloatingRepayModal from 'components/FloatingRepayModal';
import RepayModal from 'components/RepayModal';
import WithdrawModalMP from 'components/WithdrawModalMP';
import WithdrawModalSP from 'components/WithdrawModalSP';

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
