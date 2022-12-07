import React, { createContext, useContext, useEffect, useState, useMemo, useCallback } from 'react';
import type { FC, PropsWithChildren } from 'react';
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
  operation?: Operation;
  openOperationModal: (op: Operation) => void;
  closeModal: () => void;
};

const ModalStatusContext = createContext<ContextValues | null>(null);

export const ModalStatusProvider: FC<PropsWithChildren> = ({ children }) => {
  const { getAccountData } = useContext(AccountDataContext);

  const [open, setOpen] = useState<boolean>(false);

  const [operation, setOperation] = useState<Operation | undefined>();

  const openOperationModal = useCallback((op: Operation) => {
    setOperation(op);
    setOpen(true);
  }, []);

  const closeModal = useCallback(() => setOpen(false), []);

  useEffect(() => {
    if (!open && operation) {
      setTimeout(() => void getAccountData(), 5000);
    }
  }, [open, operation, getAccountData]);

  const value: ContextValues = useMemo(
    () => ({
      open,
      closeModal,
      operation,
      openOperationModal,
    }),
    [closeModal, open, openOperationModal, operation],
  );

  return <ModalStatusContext.Provider value={value}>{children}</ModalStatusContext.Provider>;
};

export function useModalStatus() {
  const ctx = useContext(ModalStatusContext);
  if (!ctx) {
    throw new Error('Using ModalStatusContext outside of provider');
  }
  return ctx;
}

export default ModalStatusContext;
