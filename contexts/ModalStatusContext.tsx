import { createContext, FC, useContext, useEffect, useState } from 'react';
import AccountDataContext from './AccountDataContext';

type Operation =
  | 'borrow'
  | 'deposit'
  | 'withdraw'
  | 'repay'
  | 'borrowAtMaturity'
  | 'depositAtMaturity'
  | 'withdrawAtMaturity'
  | 'repayAtMaturity';

type ContextValues = {
  open: boolean;
  setOpen: (open: any) => void;
  operation: Operation;
  setOperation: (operation: Operation) => void;
};

const defaultValues: ContextValues = {
  open: false,
  setOpen: () => {},
  operation: 'deposit',
  setOperation: () => {}
};

const ModalStatusContext = createContext(defaultValues);

export const ModalStatusProvider: FC = ({ children }) => {
  const { getAccountData } = useContext(AccountDataContext);
  const [open, setOpen] = useState<boolean>(false);
  const [operation, setOperation] = useState<Operation>('deposit');

  useEffect(() => {
    if (!open) {
      setTimeout(() => {
        getAccountData();
      }, 5000);
    }
  }, [open]);

  return (
    <ModalStatusContext.Provider value={{ open, setOpen, operation, setOperation }}>
      {children}
    </ModalStatusContext.Provider>
  );
};

export default ModalStatusContext;
