import { BigNumber } from '@ethersproject/bignumber';
import React, { createContext, type PropsWithChildren, type FC, useContext, useState, useCallback } from 'react';
import { ErrorData } from 'types/Error';
import { Transaction } from 'types/Transaction';
import DebtManagerModal from 'components/DebtManager';

type ContextValues = {
  isOpen: boolean;
  open: () => void;
  close: () => void;

  errorData?: ErrorData;
  setErrorData: React.Dispatch<React.SetStateAction<ErrorData | undefined>>;
  gasCost?: BigNumber;
  setGasCost: React.Dispatch<React.SetStateAction<BigNumber | undefined>>;
  tx?: Transaction;
  setTx: React.Dispatch<React.SetStateAction<Transaction | undefined>>;

  isLoading: boolean;
  setIsLoading: React.Dispatch<React.SetStateAction<boolean>>;
};

const DebtManagerContext = createContext<ContextValues | null>(null);

export const DebtManagerContextProvider: FC<PropsWithChildren> = ({ children }) => {
  const [isOpen, setIsOpen] = useState(true);
  const [errorData, setErrorData] = useState<ErrorData | undefined>();

  const [gasCost, setGasCost] = useState<BigNumber | undefined>();
  const [tx, setTx] = useState<Transaction | undefined>();
  const [isLoading, setIsLoading] = useState(false);

  const open = useCallback(() => setIsOpen(true), []);
  const close = useCallback(() => setIsOpen(false), []);

  const value: ContextValues = {
    isOpen,
    open,
    close,

    errorData,
    setErrorData,
    gasCost,
    setGasCost,
    tx,
    setTx,
    isLoading,
    setIsLoading,
  };

  return (
    <DebtManagerContext.Provider value={value}>
      {children}
      <DebtManagerModal />
    </DebtManagerContext.Provider>
  );
};

export function useDebtManagerContext() {
  const ctx = useContext(DebtManagerContext);
  if (!ctx) {
    throw new Error('Using DebtManagerContext outside of provider');
  }
  return ctx;
}

export default DebtManagerContext;
