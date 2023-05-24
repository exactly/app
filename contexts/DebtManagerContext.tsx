import { BigNumber } from '@ethersproject/bignumber';
import React, {
  createContext,
  type PropsWithChildren,
  type FC,
  useContext,
  useState,
  useCallback,
  useReducer,
} from 'react';
import { ErrorData } from 'types/Error';
import { Transaction } from 'types/Transaction';
import DebtManagerModal from 'components/DebtManager';
import type { Position } from 'components/DebtManager/types';
import useDebtManager from 'hooks/useDebtManager';

import numbers from 'config/numbers.json';
import useAccountData from 'hooks/useAccountData';
import useMarket from 'hooks/useMarket';
import { MaxUint256 } from '@ethersproject/constants';
import { useWeb3 } from 'hooks/useWeb3';
import { DebtManager, Market } from 'types/contracts';
import { checkPrecision } from 'utils/utils';

type Input = {
  from?: Position;
  to?: Position;
  slippage: string;
  percent: number;
};

const DEFAULT_SLIPPAGE = (numbers.slippage * 100).toFixed(2);

const initState: Input = {
  from: undefined,
  to: undefined,
  slippage: DEFAULT_SLIPPAGE,
  percent: 100,
};

const reducer = (state: Input, action: Partial<Input>): Input => {
  return { ...state, ...action };
};

type ContextValues = {
  isOpen: boolean;
  open: () => void;
  close: () => void;

  input: Input;
  setFrom: (from: Position) => void;
  setTo: (to: Position) => void;
  setPercent: (to: number) => void;
  setSlippage: (slippage: string) => void;

  debtManager?: DebtManager;
  market?: Market;

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
  const { getMarketAccount } = useAccountData();
  const [isOpen, setIsOpen] = useState(true);
  const [errorData, setErrorData] = useState<ErrorData | undefined>();

  const [input, dispatch] = useReducer(reducer, initState);

  const [gasCost, setGasCost] = useState<BigNumber | undefined>();
  const [tx, setTx] = useState<Transaction | undefined>();
  const [isLoading, setIsLoading] = useState(false);

  const open = useCallback(() => setIsOpen(true), []);
  const close = useCallback(() => setIsOpen(false), []);

  const setFrom = (from: Position) => dispatch({ ...initState, from });
  const setTo = (to: Position) => dispatch({ to });
  const setPercent = (percent: number) => dispatch({ percent });
  const setSlippage = (slippage: string) => dispatch({ slippage });

  const debtManager = useDebtManager();

  const market = useMarket(input.from && getMarketAccount(input.from.symbol)?.market);

  const value: ContextValues = {
    isOpen,
    open,
    close,

    input,
    setFrom,
    setTo,
    setPercent,
    setSlippage,

    debtManager,
    market,

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
