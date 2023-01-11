import { BigNumber } from '@ethersproject/bignumber';
import useAccountData from 'hooks/useAccountData';
import useDelayedEffect from 'hooks/useDelayedEffect';
import useERC20 from 'hooks/useERC20';
import useETHRouter from 'hooks/useETHRouter';
import useMarket from 'hooks/useMarket';
import { useWeb3 } from 'hooks/useWeb3';
import React, {
  createContext,
  type PropsWithChildren,
  type FC,
  useContext,
  useState,
  useCallback,
  useEffect,
} from 'react';
import { ERC20, Market, MarketETHRouter } from 'types/contracts';
import { ErrorData } from 'types/Error';
import { Transaction } from 'types/Transaction';
import handleOperationError from 'utils/handleOperationError';
import { MarketContext } from './MarketContext';
import { useModalStatus } from './ModalStatusContext';

type ContextValues = {
  symbol: string;
  errorData?: ErrorData;
  setErrorData: React.Dispatch<React.SetStateAction<ErrorData | undefined>>;
  qty: string;
  setQty: React.Dispatch<React.SetStateAction<string>>;
  gasCost?: BigNumber;
  setGasCost: React.Dispatch<React.SetStateAction<BigNumber | undefined>>;
  tx?: Transaction;
  setTx: React.Dispatch<React.SetStateAction<Transaction | undefined>>;

  isLoading: boolean;
  setIsLoading: React.Dispatch<React.SetStateAction<boolean>>;

  requiresApproval: boolean;
  setRequiresApproval: React.Dispatch<React.SetStateAction<boolean>>;

  marketContract?: Market;
  assetContract?: ERC20;
  ETHRouterContract?: MarketETHRouter;
};

const OperationContext = createContext<ContextValues | null>(null);

export const OperationContextProvider: FC<PropsWithChildren> = ({ children }) => {
  const { chain } = useWeb3();
  const { marketSymbol = 'DAI' } = useContext(MarketContext);
  const { open, operation } = useModalStatus();

  const [errorData, setErrorData] = useState<ErrorData | undefined>();

  const [qty, setQty] = useState<string>('');
  const [gasCost, setGasCost] = useState<BigNumber | undefined>();
  const [tx, setTx] = useState<Transaction | undefined>();
  const [isLoading, setIsLoading] = useState(false);
  const [requiresApproval, setRequiresApproval] = useState(false);
  const { market, asset } = useAccountData(marketSymbol);

  useEffect(() => {
    setQty('');
    setTx(undefined);
    setErrorData(undefined);
    setIsLoading(false);
    setRequiresApproval(true);
    setGasCost(undefined);
  }, [chain?.id, marketSymbol, operation, open]);

  const assetContract = useERC20(asset);
  const marketContract = useMarket(market);
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

    assetContract,
    marketContract,
    ETHRouterContract,
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
  needsApproval: (qty: string) => Promise<boolean>;
  previewGasCost: (qty: string) => Promise<BigNumber | undefined>;
}) {
  const { errorData, setErrorData, setGasCost, setRequiresApproval } = useOperationContext();

  const previewTx = useCallback(
    async (cancelled: () => boolean) => {
      let error: ErrorData | undefined = undefined;
      const approval = await needsApproval(qty).catch((e) => {
        error = { status: true, message: handleOperationError(e) };
        return null;
      });

      const gas = await previewGasCost(qty).catch((e) => {
        error = { status: true, message: handleOperationError(e), component: 'gas' };
        return null;
      });

      setErrorData(error);
      if (cancelled() || approval === null || gas === null) return;

      setGasCost(gas);
      setRequiresApproval(approval);
    },
    [needsApproval, previewGasCost, qty, setErrorData, setGasCost, setRequiresApproval],
  );

  return useDelayedEffect({
    effect: previewTx,
    skip: errorData?.status,
  });
}

export default OperationContext;
