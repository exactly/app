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
import { WeiPerEther } from '@ethersproject/constants';

import type { ErrorData } from 'types/Error';
import type { Transaction } from 'types/Transaction';
import LeveragerModal from 'components/Leverager/Modal';
import useDebtManager from 'hooks/useDebtManager';
import numbers from 'config/numbers.json';
import useAccountData from 'hooks/useAccountData';
import useMarket from 'hooks/useMarket';
import { useWeb3 } from 'hooks/useWeb3';
import type { DebtManager, Market } from 'types/contracts';
import { gasLimitMultiplier } from 'utils/const';
import useEstimateGas from 'hooks/useEstimateGas';
import handleOperationError from 'utils/handleOperationError';
import useIsContract from 'hooks/useIsContract';

type Input = {
  collateral?: string;
  borrow?: string;
  depositedSupply: number;
  walletSupply: number;
  leverageFactor: number;
  slippage: string;
};

const DEFAULT_SLIPPAGE = (numbers.slippage * 100).toFixed(2);

const initState: Input = {
  collateral: undefined,
  borrow: undefined,
  depositedSupply: 0,
  walletSupply: 0,
  leverageFactor: 1,
  slippage: DEFAULT_SLIPPAGE,
};

const reducer = (state: Input, action: Partial<Input>): Input => {
  return { ...state, ...action };
};

type ContextValues = {
  isOpen: boolean;
  openLeverager: (collateral?: string) => void;
  close: () => void;

  input: Input;
  setCollateral: (collateral: string) => void;
  setBorrow: (debt: string) => void;
  setDepositedSupply: (depositedSupply: number) => void;
  setWalletSupply: (walletSupply: number) => void;
  setLeverageFactor: (leverageFactor: number) => void;
  setSlippage: (slippage: string) => void;

  debtManager?: DebtManager;
  market?: Market;

  errorData?: ErrorData;
  setErrorData: React.Dispatch<React.SetStateAction<ErrorData | undefined>>;
  tx?: Transaction;

  isLoading: boolean;

  needsApproval: (qty: BigNumber) => Promise<boolean>;
  approve: (maxAssets: BigNumber) => Promise<void>;
  estimateTx: (transaction: PopulatedTransaction) => Promise<BigNumber | undefined>;
  submit: (populate: () => Promise<PopulatedTransaction | undefined>) => Promise<void>;
};

const LeveragerContext = createContext<ContextValues | null>(null);

export const LeveragerContextProvider: FC<PropsWithChildren> = ({ children }) => {
  const { walletAddress } = useWeb3();
  const { data: signer } = useSigner();
  const { getMarketAccount, refreshAccountData } = useAccountData();
  const isContract = useIsContract();
  const [isOpen, setIsOpen] = useState(false);
  const [errorData, setErrorData] = useState<ErrorData | undefined>();

  const [input, dispatch] = useReducer(reducer, initState);

  const [tx, setTx] = useState<Transaction | undefined>();
  const [isLoading, setIsLoading] = useState(false);

  const setCollateral = useCallback((collateral: string) => dispatch({ ...initState, collateral }), []);
  const setBorrow = useCallback((borrow: string) => dispatch({ borrow: borrow }), []);
  const setDepositedSupply = useCallback((depositedSupply: number) => dispatch({ depositedSupply }), []);
  const setWalletSupply = useCallback((walletSupply: number) => dispatch({ walletSupply }), []);
  const setLeverageFactor = useCallback((leverageFactor: number) => dispatch({ leverageFactor }), []);
  const setSlippage = useCallback((slippage: string) => dispatch({ slippage }), []);

  const openLeverager = useCallback((collateral?: string) => {
    dispatch({ ...initState, collateral });
    setTx(undefined);
    setIsLoading(false);
    setIsOpen(true);
  }, []);

  const close = useCallback(() => setIsOpen(false), []);

  const debtManager = useDebtManager();

  const market = useMarket(input.collateral && getMarketAccount(input.collateral)?.market);

  const needsApproval = useCallback(
    async (qty: BigNumber): Promise<boolean> => {
      if (!walletAddress || !market || !debtManager || qty.isZero()) return true;
      try {
        if (!(await isContract(walletAddress))) return false;
        const allowance = await market.allowance(walletAddress, debtManager.address);
        return allowance.lte(qty);
      } catch (e: unknown) {
        setErrorData({ status: true, message: handleOperationError(e) });
        return true;
      }
    },
    [walletAddress, market, debtManager, isContract],
  );

  const approve = useCallback(
    async (maxAssets: BigNumber) => {
      if (!debtManager || !market || !walletAddress || !signer) return;

      setIsLoading(true);
      try {
        const max = maxAssets.mul(100_005).div(100_000);
        const gasEstimation = await market.estimateGas.approve(debtManager.address, max);
        const approveTx = await market.approve(debtManager.address, max, {
          gasLimit: gasEstimation.mul(gasLimitMultiplier).div(WeiPerEther),
        });
        await approveTx.wait();
      } catch (e: unknown) {
        setErrorData({ status: true, message: handleOperationError(e) });
      } finally {
        setIsLoading(false);
      }
    },
    [debtManager, market, signer, walletAddress],
  );

  const estimate = useEstimateGas();

  const estimateTx = useCallback(async (transaction: PopulatedTransaction) => estimate(transaction), [estimate]);

  const submit = useCallback(
    async (populate: () => Promise<PopulatedTransaction | undefined>) => {
      if (!walletAddress || !signer || !market || !debtManager) return;

      setIsLoading(true);

      try {
        const transaction = await populate();
        if (!transaction) return;
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
    [walletAddress, signer, market, debtManager, refreshAccountData],
  );

  const value: ContextValues = {
    isOpen,
    openLeverager,
    close,

    input,
    setCollateral,
    setBorrow,
    setDepositedSupply,
    setWalletSupply,
    setLeverageFactor,
    setSlippage,

    debtManager,
    market,

    errorData,
    setErrorData,
    tx,
    isLoading,

    needsApproval,
    approve,
    estimateTx,
    submit,
  };

  return (
    <LeveragerContext.Provider value={value}>
      {children}
      <LeveragerModal />
    </LeveragerContext.Provider>
  );
};

export function useLeveragerContext() {
  const ctx = useContext(LeveragerContext);
  if (!ctx) {
    throw new Error('Using LeveragerContext outside of provider');
  }
  return ctx;
}

export default LeveragerContext;
