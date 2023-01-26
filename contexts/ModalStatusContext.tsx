import React, { createContext, useContext, useState, useMemo, useCallback, useRef, useEffect } from 'react';
import type { FC, PropsWithChildren } from 'react';
import OperationsModal from 'components/OperationsModal';
import AccountDataContext from './AccountDataContext';
import { OperationContextProvider } from './OperationContext';

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

export function isFixedOperation(operation: Operation): boolean {
  return operation.endsWith('AtMaturity');
}

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
  const first = useRef(true);

  const [operation, setOperation] = useState<Operation>('deposit');

  const openOperationModal = useCallback((op: Operation) => {
    setOperation(op);
    setOpen(true);
    first.current = false;
  }, []);

  const closeModal = useCallback(() => setOpen(false), []);

  useEffect(() => {
    if (!open && !first.current) {
      setTimeout(() => void getAccountData(), 5000);
    }
  }, [open, getAccountData]);

  const toggle = useCallback(() => {
    if (!operation) return;
    if (isFixedOperation(operation)) {
      return setOperation(operation.replaceAll('AtMaturity', '') as Operation);
    }
    setOperation(`${operation}AtMaturity` as Operation);
  }, [operation]);

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
      <OperationContextProvider>
        <OperationsModal />
      </OperationContextProvider>
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
