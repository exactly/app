import React, {
  createContext,
  type PropsWithChildren,
  type FC,
  useContext,
  useState,
  useCallback,
  useEffect,
  useMemo,
  SetStateAction,
} from 'react';
import { Address, parseUnits } from 'viem';

import useAccountData from 'hooks/useAccountData';
import { ErrorData } from 'types/Error';
import numbers from 'config/numbers.json';
import type { Operation } from 'types/Operation';
import { Args } from './ModalContext';
import useInstallmentsData from '../hooks/useInstallmentsData';

type ContextValues = {
  operation: Operation;
  setOperation: React.Dispatch<React.SetStateAction<Operation>>;

  symbol: string;
  setSymbol: React.Dispatch<React.SetStateAction<string>>;
  errorData?: ErrorData;
  setErrorData: React.Dispatch<React.SetStateAction<ErrorData | undefined>>;
  qty: string;
  setQty: React.Dispatch<React.SetStateAction<string>>;

  isLoading: boolean;
  setIsLoading: React.Dispatch<React.SetStateAction<boolean>>;

  date?: bigint;
  dates: bigint[];
  setDate: React.Dispatch<React.SetStateAction<bigint | undefined>>;

  rawSlippage: string;
  setRawSlippage: React.Dispatch<React.SetStateAction<string>>;
  slippage: bigint;

  errorButton?: string;
  setErrorButton: (error?: string) => void;

  receiver?: Address;
  setReceiver: React.Dispatch<React.SetStateAction<Address | undefined>>;

  installments: number;
  onInstallmentsChange: (installments: number) => void;

  installmentsOptions: ReturnType<typeof useInstallmentsData>['installmentsOptions'];
  installmentsDetails: ReturnType<typeof useInstallmentsData>['installmentsDetails'];
};

const OperationContext = createContext<ContextValues | null>(null);

export const DEFAULT_SLIPPAGE = (numbers.slippage * 100).toFixed(2);

type Props = {
  args?: Args<'operation'>;
};

export const OperationContextProvider: FC<PropsWithChildren<Props>> = ({ args, children }) => {
  const [marketSymbol, setMarketSymbol] = useState<string>(args?.symbol ?? 'USDC');
  const [operation, setOperation] = useState<Operation>(args?.operation ?? 'deposit');
  const [date, setDate] = useState<bigint | undefined>(args?.maturity);

  const { marketAccount } = useAccountData(marketSymbol);

  const dates = useMemo<bigint[]>(() => marketAccount?.fixedPools.map((pool) => pool.maturity) ?? [], [marketAccount]);

  useEffect(() => {
    if (dates.length && date === undefined) {
      setDate(dates[0]);
    }
  }, [date, dates]);

  const [errorData, setErrorData] = useState<ErrorData | undefined>();

  const [qty, setQty] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorButton, setErrorButton] = useState<string | undefined>();
  const [rawSlippage, setRawSlippage] = useState(DEFAULT_SLIPPAGE);
  const [receiver, setReceiver] = useState<Address>();
  const [installments, setInstallments] = useState<number>(1);

  const slippage = useMemo(() => {
    return ['deposit', 'depositAtMaturity', 'withdraw', 'withdrawAtMaturity'].includes(operation)
      ? parseUnits(String(1 - Number(rawSlippage) / 100), 18)
      : parseUnits(String(1 + Number(rawSlippage) / 100), 18);
  }, [operation, rawSlippage]);

  const { installmentsOptions, installmentsDetails } = useInstallmentsData({
    operation,
    qty,
    date,
    symbol: marketSymbol,
    installments,
  });
  const handleInstallmentsChange = useCallback(
    (installments_: number) => {
      setInstallments(installments_);
      if (!installmentsOptions) return;
      setDate(installmentsOptions[installments_ - 1].startingDate);
    },
    [installmentsOptions],
  );

  const handleDateChange = useCallback((date_: SetStateAction<bigint | undefined>) => {
    setDate(date_);
    setInstallments(1);
  }, []);

  const value: ContextValues = {
    operation,
    setOperation,

    symbol: marketSymbol,
    setSymbol: setMarketSymbol,
    errorData,
    setErrorData,
    qty,
    setQty,
    isLoading,
    setIsLoading,

    date,
    dates,
    setDate: handleDateChange,

    rawSlippage,
    setRawSlippage,
    slippage,

    errorButton,
    setErrorButton,
    receiver,
    setReceiver,
    installments,
    onInstallmentsChange: handleInstallmentsChange,
    installmentsOptions,
    installmentsDetails,
  };

  return <OperationContext.Provider value={value}>{children}</OperationContext.Provider>;
};

export function useOperationContext() {
  const ctx = useContext(OperationContext);
  if (!ctx) {
    throw new Error('Using OperationContext outside of provider');
  }
  return ctx;
}

export default OperationContext;
