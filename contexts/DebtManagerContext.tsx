import React, {
  createContext,
  type PropsWithChildren,
  type FC,
  useContext,
  useState,
  useCallback,
  useReducer,
} from 'react';
import { BigNumber } from '@ethersproject/bignumber';
import { useSigner } from 'wagmi';
import { PopulatedTransaction } from '@ethersproject/contracts';

import { ErrorData } from 'types/Error';
import { Transaction } from 'types/Transaction';
import DebtManagerModal from 'components/DebtManager';
import type { Position } from 'components/DebtManager/types';
import useDebtManager from 'hooks/useDebtManager';
import numbers from 'config/numbers.json';
import useAccountData from 'hooks/useAccountData';
import useMarket from 'hooks/useMarket';
import { MaxUint256, WeiPerEther } from '@ethersproject/constants';
import { useWeb3 } from 'hooks/useWeb3';
import { DebtManager, Market } from 'types/contracts';
import { gasLimitMultiplier } from 'utils/const';
import useEstimateGas from 'hooks/useEstimateGas';
import handleOperationError from 'utils/handleOperationError';

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

  isLoading: boolean;

  needsApproval: (qty: BigNumber) => Promise<boolean>;
  approve: () => Promise<void>;
  estimateTx: (transaction: PopulatedTransaction) => Promise<BigNumber | undefined>;
  submit: (transaction: PopulatedTransaction) => Promise<void>;
};

const DebtManagerContext = createContext<ContextValues | null>(null);

export const DebtManagerContextProvider: FC<PropsWithChildren> = ({ children }) => {
  const { walletAddress } = useWeb3();
  const { data: signer } = useSigner();
  const { getMarketAccount, refreshAccountData } = useAccountData();
  const [isOpen, setIsOpen] = useState(true);
  const [errorData, setErrorData] = useState<ErrorData | undefined>();

  const [input, dispatch] = useReducer(reducer, initState);

  const [gasCost, setGasCost] = useState<BigNumber | undefined>();
  const [tx, setTx] = useState<Transaction | undefined>();
  const [isLoading, setIsLoading] = useState(false);

  const setFrom = useCallback((from: Position) => dispatch({ ...initState, from }), []);
  const setTo = useCallback((to: Position) => dispatch({ to }), []);
  const setPercent = useCallback((percent: number) => dispatch({ percent }), []);
  const setSlippage = useCallback((slippage: string) => dispatch({ slippage }), []);

  const open = useCallback(() => {
    dispatch(initState);
    setTx(undefined);
    setIsOpen(true);
  }, []);
  const close = useCallback(() => setIsOpen(false), []);

  const debtManager = useDebtManager();

  const market = useMarket(input.from && getMarketAccount(input.from.symbol)?.market);

  const needsApproval = useCallback(
    async (qty: BigNumber): Promise<boolean> => {
      if (!walletAddress || !market || !debtManager || qty.isZero()) return true;

      try {
        const allowance = await market.allowance(walletAddress, debtManager.address);
        return allowance.isZero() || allowance.lt(qty);
      } catch (e: unknown) {
        setErrorData({ status: true, message: handleOperationError(e) });
        return true;
      }
    },
    [walletAddress, market, debtManager],
  );

  const approve = useCallback(async () => {
    if (!debtManager || !market) return;

    setIsLoading(true);
    try {
      const gasEstimation = await market.estimateGas.approve(debtManager.address, MaxUint256);
      const approveTx = await market.approve(debtManager.address, MaxUint256, {
        gasLimit: gasEstimation.mul(gasLimitMultiplier).div(WeiPerEther),
      });
      await approveTx.wait();
    } catch (e: unknown) {
      setErrorData({ status: true, message: handleOperationError(e) });
    } finally {
      setIsLoading(false);
    }
  }, [debtManager, market]);

  const estimate = useEstimateGas();

  const estimateTx = useCallback(async (transaction: PopulatedTransaction) => estimate(transaction), [estimate]);

  const submit = useCallback(
    async (transaction: PopulatedTransaction) => {
      if (!signer) return;

      setIsLoading(true);
      try {
        const transactionResponse = await signer.sendTransaction(transaction);
        setTx({ status: 'processing', hash: transactionResponse.hash });
        const { status, transactionHash } = await transactionResponse.wait();
        setTx({ status: status ? 'success' : 'error', hash: transactionHash });

        await refreshAccountData();
      } catch (e: unknown) {
        setErrorData({ status: true, message: handleOperationError(e) });
      } finally {
        setIsLoading(false);
      }
    },
    [signer, refreshAccountData],
  );

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
    isLoading,

    needsApproval,
    approve,
    estimateTx,
    submit,
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
