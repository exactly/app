import React, {
  createContext,
  type PropsWithChildren,
  type FC,
  useContext,
  useState,
  useCallback,
  useEffect,
  useMemo,
} from 'react';
import { parseUnits } from 'viem';

import useAccountData from 'hooks/useAccountData';
import useDelayedEffect from 'hooks/useDelayedEffect';
import useERC20 from 'hooks/useERC20';
import useETHRouter from 'hooks/useETHRouter';
import useHandleOperationError from 'hooks/useHandleOperationError';
import useMarket from 'hooks/useMarket';
import { useWeb3 } from 'hooks/useWeb3';
import useRouter from 'hooks/useRouter';
import { ERC20, Market, MarketETHRouter } from 'types/contracts';
import { ErrorData } from 'types/Error';
import { OperationHook } from 'types/OperationHook';
import { Transaction } from 'types/Transaction';
import { useModalStatus } from './ModalStatusContext';
import numbers from 'config/numbers.json';
import { useMarketContext } from './MarketContext';

type LoadingButton = { withCircularProgress?: boolean; label?: string | null };

type ContextValues = {
  symbol: string;
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

  date: number | undefined;

  marketContract?: Market;
  assetContract?: ERC20;
  ETHRouterContract?: MarketETHRouter;

  rawSlippage: string;
  setRawSlippage: React.Dispatch<React.SetStateAction<string>>;
  slippage: bigint;

  loadingButton: LoadingButton;
  setLoadingButton: (loading: LoadingButton) => void;
  errorButton?: string | null;
  setErrorButton: (error?: string | null) => void;
};

const OperationContext = createContext<ContextValues | null>(null);

const DEFAULT_SLIPPAGE = (numbers.slippage * 100).toFixed(2);

export const OperationContextProvider: FC<PropsWithChildren> = ({ children }) => {
  const { pathname } = useRouter();
  const { chain } = useWeb3();
  const { marketSymbol, view, date } = useMarketContext();
  const { open, operation } = useModalStatus();

  const [errorData, setErrorData] = useState<ErrorData | undefined>();

  const [qty, setQty] = useState<string>('');
  const [gasCost, setGasCost] = useState<bigint | undefined>();
  const [tx, setTx] = useState<Transaction | undefined>();
  const [isLoading, setIsLoading] = useState(false);
  const [loadingButton, setLoadingButton] = useState<LoadingButton>({});
  const [errorButton, setErrorButton] = useState<string | undefined | null>();
  const [requiresApproval, setRequiresApproval] = useState(false);
  const { marketAccount } = useAccountData(marketSymbol);
  const [rawSlippage, setRawSlippage] = useState(DEFAULT_SLIPPAGE);

  const slippage = useMemo(() => {
    return ['deposit', 'depositAtMaturity', 'withdraw', 'withdrawAtMaturity'].includes(operation)
      ? parseUnits(String(1 - Number(rawSlippage) / 100) as `${number}`, 18)
      : parseUnits(String(1 + Number(rawSlippage) / 100) as `${number}`, 18);
  }, [operation, rawSlippage]);

  useEffect(() => {
    if (!(open && view === 'simple' && pathname === '/')) {
      setQty('');
      setTx(undefined);
      setRequiresApproval(true);
      setGasCost(undefined);
      setIsLoading(false);
    }
    setLoadingButton({});
    setErrorData(undefined);
    setErrorButton(undefined);
    setRawSlippage(DEFAULT_SLIPPAGE);
  }, [chain?.id, open, view, pathname]);

  const assetContract = useERC20(marketAccount?.asset);
  const marketContract = useMarket(marketAccount?.market);
  const ETHRouterContract = useETHRouter();

  const value: ContextValues = {
    symbol: marketSymbol,
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
