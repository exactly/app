import type { FC, ReactNode } from 'react';
import React, { createContext, useContext, useEffect, useState } from 'react';
import AccountDataContext from './AccountDataContext';

export type Operation =
  | 'borrow'
  | 'deposit'
  | 'withdraw'
  | 'repay'
  | 'borrowAtMaturity'
  | 'depositAtMaturity'
  | 'withdrawAtMaturity'
  | 'repayAtMaturity'
  | 'faucet';

type ContextValues = {
  open: boolean;
  setOpen: (open: any) => void;
  operation: Operation | null;
  setOperation: (operation: Operation) => void;
};

const defaultValues: ContextValues = {
  open: false,
  setOpen: () => undefined,
  operation: null,
  setOperation: () => undefined,
};

const ModalStatusContext = createContext(defaultValues);

export const ModalStatusProvider: FC<{ children?: ReactNode }> = ({ children }) => {
  const { getAccountData } = useContext(AccountDataContext);
  const [open, setOpen] = useState<boolean>(false);
  const [operation, setOperation] = useState<Operation | null>(null);

  useEffect(() => {
    if (!open && operation) {
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
