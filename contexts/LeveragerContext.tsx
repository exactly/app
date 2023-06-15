import React, {
  createContext,
  type PropsWithChildren,
  type FC,
  useContext,
  useState,
  useCallback,
  useReducer,
  useMemo,
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
import useBalance from 'hooks/useBalance';
import { useTranslation } from 'react-i18next';

type Input = {
  collateralSymbol?: string;
  borrowSymbol?: string;
  secondaryOperation: 'deposit' | 'withdraw';
  userInput: string;
  leverageRatio: number;
  slippage: string;
};

const DEFAULT_SLIPPAGE = (numbers.slippage * 100).toFixed(2);

const initState: Input = {
  collateralSymbol: undefined,
  borrowSymbol: undefined,
  secondaryOperation: 'deposit',
  userInput: '',
  leverageRatio: 1,
  slippage: DEFAULT_SLIPPAGE,
};

const reducer = (state: Input, action: Partial<Input>): Input => {
  return { ...state, ...action };
};

type ContextValues = {
  isOpen: boolean;
  openLeverager: (collateralSymbol?: string) => void;
  close: () => void;

  input: Input;
  setCollateralSymbol: (collateralSymbol: string) => void;
  setBorrowSymbol: (debt: string) => void;
  setSecondaryOperation: (secondaryOperation: 'deposit' | 'withdraw') => void;
  setUserInput: (userInput: string) => void;
  setLeverageRatio: (leverageRatio: number) => void;
  setSlippage: (slippage: string) => void;

  currentLeverageRatio: number;
  newHealthFactor: string | undefined;
  minLeverageRatio: number;
  maxLeverageRatio: number;
  onMax: () => void;
  handleInputChange: (value: string) => void;
  netPosition: string | undefined;
  available: string | undefined;

  loopAPR: number | undefined;
  marketAPR: number | undefined;
  rewardsAPR: number | undefined;
  nativeAPR: number | undefined;

  marketRewards: string[];
  nativeRewards: string[];

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
  const { t } = useTranslation();
  const { walletAddress } = useWeb3();
  const { data: signer } = useSigner();
  const { getMarketAccount, refreshAccountData } = useAccountData();
  const isContract = useIsContract();
  const [isOpen, setIsOpen] = useState(false);
  const [errorData, setErrorData] = useState<ErrorData | undefined>();

  const [input, dispatch] = useReducer(reducer, initState);

  const [tx, setTx] = useState<Transaction | undefined>();
  const [isLoading, setIsLoading] = useState(false);

  const netPosition = useMemo(() => '430', []); // TODO: calculate
  const getCurrentLeverageRatio = useCallback(() => {
    // TODO: diff between collateral and borrow to take principal
    // leverageRatio = collateral / principal
    return 2;
  }, []);

  const currentLeverageRatio = useMemo(() => getCurrentLeverageRatio(), [getCurrentLeverageRatio]);

  // TODO: calculate
  const minLeverageRatio = useMemo(() => 1, []);

  // TODO: calculate
  const maxLeverageRatio = useMemo(() => 7, []);

  // TODO: calculate
  const newHealthFactor = useMemo(() => '1.009x', []);

  const setCollateralSymbol = useCallback(
    (collateralSymbol: string) => dispatch({ ...initState, collateralSymbol }),
    [],
  );
  const setBorrowSymbol = useCallback(
    (borrowSymbol: string) => {
      const _currentLeverageRatio = getCurrentLeverageRatio();
      dispatch({
        ...initState,
        collateralSymbol: input.collateralSymbol,
        borrowSymbol: borrowSymbol,
        leverageRatio: _currentLeverageRatio,
      });
    },
    [getCurrentLeverageRatio, input.collateralSymbol],
  );
  const setSecondaryOperation = useCallback(
    (secondaryOperation: 'deposit' | 'withdraw') => dispatch({ secondaryOperation, userInput: '' }),
    [],
  );
  const setUserInput = useCallback((userInput: string) => dispatch({ userInput }), []);
  const setLeverageRatio = useCallback(
    (leverageRatio: number) => {
      const _secondaryOperation = leverageRatio < currentLeverageRatio ? 'withdraw' : 'deposit';
      dispatch({
        leverageRatio,
        secondaryOperation: _secondaryOperation,
        userInput: _secondaryOperation !== input.secondaryOperation ? '' : input.userInput,
      });
    },
    [currentLeverageRatio, input.secondaryOperation, input.userInput],
  );
  const setSlippage = useCallback((slippage: string) => dispatch({ slippage }), []);

  const openLeverager = useCallback((collateralSymbol?: string) => {
    dispatch({ ...initState, collateralSymbol });
    setTx(undefined);
    setIsLoading(false);
    setIsOpen(true);
  }, []);

  const close = useCallback(() => setIsOpen(false), []);

  const market = useMarket(input.collateralSymbol && getMarketAccount(input.collateralSymbol)?.market);

  const walletBalance = useBalance(input.collateralSymbol, market);

  //TODO: handle withdraw
  const onMax = useCallback(() => {
    if (walletBalance) {
      setUserInput(walletBalance);
      setErrorData(undefined);
    }
  }, [walletBalance, setUserInput, setErrorData]);

  //TODO: handle withdraw
  const handleInputChange = useCallback(
    (value: string) => {
      setUserInput(value);

      if (walletBalance && parseFloat(value) > parseFloat(walletBalance)) {
        setErrorData({ status: true, message: t('Insufficient balance') });
        return;
      }
      setErrorData(undefined);
    },
    [setUserInput, walletBalance, setErrorData, t],
  );

  //TODO: handle withdraw
  const available = useMemo(() => walletBalance, [walletBalance]);

  //TODO: calculate
  const [loopAPR, marketAPR, rewardsAPR, nativeAPR] = useMemo(() => [0.137, 0.074, 0.021, 0.042], []);

  // TODO: calculate
  const marketRewards = useMemo(() => ['OP', 'USDC'], []);

  // TODO: calculate
  const nativeRewards = useMemo(() => ['WBTC'], []);

  const debtManager = useDebtManager();
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
    setCollateralSymbol,
    setBorrowSymbol,
    setSecondaryOperation,
    setUserInput,
    setLeverageRatio,
    setSlippage,

    currentLeverageRatio,
    newHealthFactor,
    minLeverageRatio,
    maxLeverageRatio,
    onMax,
    handleInputChange,
    netPosition,
    available,

    loopAPR,
    marketAPR,
    rewardsAPR,
    nativeAPR,

    marketRewards,
    nativeRewards,

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
