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
import useDelayedEffect from 'hooks/useDelayedEffect';
import useERC20 from 'hooks/useERC20';
import useETHRouter from 'hooks/useETHRouter';
import useHandleOperationError from 'hooks/useHandleOperationError';
import useMarket from 'hooks/useMarket';
import { ERC20, Market, MarketETHRouter } from 'types/contracts';
import { ErrorData } from 'types/Error';
import { OperationHook } from 'types/OperationHook';
import { Transaction } from 'types/Transaction';
import numbers from 'config/numbers.json';
import type { Operation } from 'types/Operation';
import { Args } from './ModalContext';
import useInstallmentsData from '../hooks/useInstallmentsData';

type LoadingButton = { withCircularProgress?: boolean; label?: string };

type ContextValues = {
  operation: Operation;
  setOperation: React.Dispatch<React.SetStateAction<Operation>>;

  symbol: string;
  setSymbol: React.Dispatch<React.SetStateAction<string>>;
  errorData?: ErrorData;
  setErrorData: React.Dispatch<React.SetStateAction<ErrorData | undefined>>;
  qty: string;
  setQty: React.Dispatch<React.SetStateAction<string>>;
  gasCost?: bigint;
  setGasCost: React.Dispatch<React.SetStateAction<bigint | undefined>>;
  tx?: Transaction;
  setTx: React.Dispatch<React.SetStateAction<Transaction | undefined>>;

  isLoading: boolean;
  setIsLoading: React.Dispatch<React.SetStateAction<boolean>>;

  requiresApproval: boolean;
  setRequiresApproval: React.Dispatch<React.SetStateAction<boolean>>;

  date?: bigint;
  dates: bigint[];
  setDate: React.Dispatch<React.SetStateAction<bigint | undefined>>;

  marketContract?: Market;
  assetContract?: ERC20;
  ETHRouterContract?: MarketETHRouter;

  rawSlippage: string;
  setRawSlippage: React.Dispatch<React.SetStateAction<string>>;
  slippage: bigint;

  loadingButton: LoadingButton;
  setLoadingButton: (loading: LoadingButton) => void;
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
  const [gasCost, setGasCost] = useState<bigint | undefined>();
  const [tx, setTx] = useState<Transaction | undefined>();
  const [isLoading, setIsLoading] = useState(false);
  const [loadingButton, setLoadingButton] = useState<LoadingButton>({});
  const [errorButton, setErrorButton] = useState<string | undefined>();
  const [requiresApproval, setRequiresApproval] = useState(false);
  const [rawSlippage, setRawSlippage] = useState(DEFAULT_SLIPPAGE);
  const [receiver, setReceiver] = useState<Address>();
  const [installments, setInstallments] = useState<number>(1);

  const slippage = useMemo(() => {
    return ['deposit', 'depositAtMaturity', 'withdraw', 'withdrawAtMaturity'].includes(operation)
      ? parseUnits(String(1 - Number(rawSlippage) / 100), 18)
      : parseUnits(String(1 + Number(rawSlippage) / 100), 18);
  }, [operation, rawSlippage]);

  const assetContract = useERC20(marketAccount?.asset);
  const marketContract = useMarket(marketAccount?.market);
  const ETHRouterContract = useETHRouter();
  const { installmentsOptions, installmentsDetails } = useInstallmentsData({
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
    gasCost,
    setGasCost,
    tx,
    setTx,
    isLoading,
    setIsLoading,
    requiresApproval,
    setRequiresApproval,

    date,
    dates,
    setDate: handleDateChange,

    assetContract,
    marketContract,
    ETHRouterContract,

    rawSlippage,
    setRawSlippage,
    slippage,

    loadingButton,
    setLoadingButton,
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

export function usePreviewTx({
  qty,
  needsApproval,
  previewGasCost,
}: {
  qty: string;
} & Pick<OperationHook, 'needsApproval' | 'previewGasCost'>) {
  const { errorData, setErrorData, setGasCost, setRequiresApproval } = useOperationContext();
  const handleOperationError = useHandleOperationError();

  const previewTx = useCallback(
    async (cancelled: () => boolean) => {
      let error: ErrorData | undefined = undefined;
      const approval = await needsApproval(qty).catch((e) => {
        error = { status: true, message: handleOperationError(e) };
        return null;
      });

      const gas = await previewGasCost(qty).catch((e) => {
        error = { status: true, message: handleOperationError(e), component: 'gas', variant: e.variant };
        return null;
      });

      setErrorData(error);
      if (cancelled() || approval === null || gas === null) return;

      setGasCost(gas);
      setRequiresApproval(approval);
    },
    [handleOperationError, needsApproval, previewGasCost, qty, setErrorData, setGasCost, setRequiresApproval],
  );

  return useDelayedEffect({
    effect: previewTx,
    skip: errorData?.status,
  });
}

export default OperationContext;
