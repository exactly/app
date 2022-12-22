import React, { createContext, useContext, useEffect, useState, useMemo, useCallback } from 'react';
import type { FC, PropsWithChildren } from 'react';
import AccountDataContext from './AccountDataContext';
import OperationsModal from 'components/OperationsModal';

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
  operation: Operation;
  openOperationModal: (op: Operation) => void;
  toggle: () => void;
  closeModal: () => void;
};

const ModalStatusContext = createContext<ContextValues | null>(null);

export const ModalStatusProvider: FC<PropsWithChildren> = ({ children }) => {
  const { getAccountData } = useContext(AccountDataContext);

  const [open, setOpen] = useState<boolean>(false);

  const [operation, setOperation] = useState<Operation>('deposit');

  const openOperationModal = useCallback((op: Operation) => {
    setOperation(op);
    setOpen(true);
  }, []);

  const closeModal = useCallback(() => setOpen(false), []);

  const toggle = useCallback(() => {
    if (!operation) return;
    if (operation.endsWith('AtMaturity')) {
      return setOperation(operation.replaceAll('AtMaturity', '') as Operation);
    }
    setOperation(`${operation}AtMaturity` as Operation);
  }, [operation]);

  useEffect(() => {
    if (!open) {
      setTimeout(() => void getAccountData(), 5000);
    }
  }, [open, getAccountData]);

  const value: ContextValues = useMemo(
    () => ({
      open,
      closeModal,
      operation,
      openOperationModal,
      toggle,
    }),
    [closeModal, open, openOperationModal, operation, toggle],
  );

  return (
    <ModalStatusContext.Provider value={value}>
      {children}
      <OperationsModal />
    </ModalStatusContext.Provider>
  );
};

export function useModalStatus() {
  const ctx = useContext(ModalStatusContext);
  if (!ctx) {
    throw new Error('Using ModalStatusContext outside of provider');
  }
  return ctx;
}

export default ModalStatusContext;
