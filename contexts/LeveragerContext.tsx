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
import { useWalletClient } from 'wagmi';
import { waitForTransaction } from '@wagmi/core';

import type { ErrorData } from 'types/Error';
import type { PopulatedTransaction, Transaction } from 'types/Transaction';
import LeveragerModal from 'components/Leverager/Modal';
import useDebtManager from 'hooks/useDebtManager';
import numbers from 'config/numbers.json';
import useAccountData from 'hooks/useAccountData';
import useMarket from 'hooks/useMarket';
import { useWeb3 } from 'hooks/useWeb3';
import type { DebtManager, Market } from 'types/contracts';
import { GAS_LIMIT_MULTIPLIER, WEI_PER_ETHER } from 'utils/const';
import handleOperationError from 'utils/handleOperationError';
import useIsContract from 'hooks/useIsContract';
import useBalance from 'hooks/useBalance';
import { useTranslation } from 'react-i18next';
import useAssets from 'hooks/useAssets';
import { useTheme } from '@mui/material';
import formatNumber from 'utils/formatNumber';
import { formatEther } from 'viem';

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

  viewSummary: boolean;
  setViewSummary: (state: boolean) => void;
  acceptedTerms: boolean;
  setAcceptedTerms: (state: boolean) => void;

  input: Input;
  setCollateralSymbol: (collateralSymbol: string) => void;
  setBorrowSymbol: (debt: string) => void;
  setSecondaryOperation: (secondaryOperation: 'deposit' | 'withdraw') => void;
  setUserInput: (userInput: string) => void;
  setLeverageRatio: (leverageRatio: number) => void;

  setSlippage: (slippage: string) => void;
  collateralOptions: { symbol: string; value: string }[];
  borrowOptions: { symbol: string; value: string }[];

  currentLeverageRatio: number;
  newHealthFactor: string | undefined;
  newCollateral: number;
  newBorrow: number;
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

  disabledSubmit: boolean;
  disabledConfirm: boolean;

  getHealthFactorColor: (_healthFactor: string | undefined) => { color: string; bg: string };
  getHealthFactorRisk: (_healthFactor: string | undefined) => string;

  debtManager?: DebtManager;
  market?: Market;

  errorData?: ErrorData;
  setErrorData: React.Dispatch<React.SetStateAction<ErrorData | undefined>>;
  tx?: Transaction;

  isLoading: boolean;

  needsApproval: (qty: bigint) => Promise<boolean>;
  approve: (maxAssets: bigint) => Promise<void>;
  submit: (populate: () => Promise<PopulatedTransaction | undefined>) => Promise<void>;
};

const LeveragerContext = createContext<ContextValues | null>(null);

export const LeveragerContextProvider: FC<PropsWithChildren> = ({ children }) => {
  const { t } = useTranslation();
  const { palette } = useTheme();
  const { walletAddress, opts } = useWeb3();
  const { data: walletClient } = useWalletClient();
  const { getMarketAccount, refreshAccountData } = useAccountData();
  const isContract = useIsContract();
  const [isOpen, setIsOpen] = useState(false);
  const [viewSummary, setViewSummary] = useState(false);
  const [errorData, setErrorData] = useState<ErrorData | undefined>();

  const [input, dispatch] = useReducer(reducer, initState);

  const [tx, setTx] = useState<Transaction | undefined>();
  const [isLoading, setIsLoading] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);

  const options = useAssets();

  const [collateralOptions, borrowOptions] = useMemo(
    () => [
      options.flatMap((symbol) => {
        const marketAccount = getMarketAccount(symbol);
        if (!marketAccount) return [];
        const { floatingDepositAssets, usdPrice, decimals } = marketAccount;
        return [
          {
            symbol,
            value: '$' + formatNumber(formatEther((floatingDepositAssets * usdPrice) / 10n ** BigInt(decimals)), 'USD'),
          },
        ];
      }),
      options.flatMap((symbol) => {
        const marketAccount = getMarketAccount(symbol);
        if (!marketAccount) return [];
        const { floatingBorrowAssets, usdPrice, decimals } = marketAccount;
        return [
          {
            symbol,
            value: '$' + formatNumber(formatEther((floatingBorrowAssets * usdPrice) / 10n ** BigInt(decimals)), 'USD'),
          },
        ];
      }),
    ],
    [options, getMarketAccount],
  );

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
  const newHealthFactor = useMemo(() => '1.05x', []);

  // TODO: calculate
  const newCollateral = useMemo(() => 32, []);

  // TODO: calculate
  const newBorrow = useMemo(() => 15.2, []);

  const setCollateralSymbol = useCallback((collateralSymbol: string) => {
    setErrorData(undefined);
    dispatch({ ...initState, collateralSymbol });
  }, []);
  const setBorrowSymbol = useCallback(
    (borrowSymbol: string) => {
      const _currentLeverageRatio = getCurrentLeverageRatio();
      setErrorData(undefined);
      dispatch({
        ...initState,
        collateralSymbol: input.collateralSymbol,
        borrowSymbol: borrowSymbol,
        leverageRatio: _currentLeverageRatio,
      });
    },
    [getCurrentLeverageRatio, input.collateralSymbol],
  );
  const setSecondaryOperation = useCallback((secondaryOperation: 'deposit' | 'withdraw') => {
    setErrorData(undefined);
    dispatch({ secondaryOperation, userInput: '' });
  }, []);
  const setUserInput = useCallback((userInput: string) => {
    setErrorData(undefined);
    dispatch({ userInput });
  }, []);
  const setLeverageRatio = useCallback(
    (leverageRatio: number) => {
      const _secondaryOperation = leverageRatio < currentLeverageRatio ? 'withdraw' : 'deposit';
      const changedOperation = _secondaryOperation !== input.secondaryOperation;
      if (changedOperation) {
        setErrorData(undefined);
      }

      dispatch({
        leverageRatio,
        secondaryOperation: _secondaryOperation,
        userInput: changedOperation ? '' : input.userInput,
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

  const _setViewSummary = useCallback((_state: boolean) => {
    setAcceptedTerms(false);
    setViewSummary(_state);
  }, []);

  const market = useMarket(getMarketAccount(input?.collateralSymbol ?? 'USDC')?.market);

  const walletBalance = useBalance(input.collateralSymbol, market?.address);

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

  const disabledSubmit = useMemo(
    () =>
      !input.collateralSymbol ||
      !input.borrowSymbol ||
      errorData?.status ||
      (currentLeverageRatio === input.leverageRatio && !input.userInput),
    [
      currentLeverageRatio,
      errorData?.status,
      input.borrowSymbol,
      input.collateralSymbol,
      input.leverageRatio,
      input.userInput,
    ],
  );

  const disabledConfirm = useMemo(() => disabledSubmit || !acceptedTerms, [acceptedTerms, disabledSubmit]);

  const getHealthFactorColor = useCallback(
    (_healthFactor: string | undefined) => {
      if (!_healthFactor) return { color: palette.healthFactor.safe, bg: palette.healthFactor.bg.safe };
      const parsedHF = parseFloat(_healthFactor);
      const status = parsedHF < 1.01 ? 'danger' : parsedHF < 1.05 ? 'warning' : 'safe';
      return { color: palette.healthFactor[status], bg: palette.healthFactor.bg[status] };
    },
    [palette.healthFactor],
  );

  const getHealthFactorRisk = useCallback(
    (_healthFactor: string | undefined) => {
      if (!_healthFactor) return t('low risk');
      const parsedHF = parseFloat(_healthFactor);
      const risk = parsedHF < 1.01 ? 'high risk' : parsedHF < 1.05 ? 'mid risk' : 'low risk';
      return t(risk);
    },
    [t],
  );

  const debtManager = useDebtManager();

  // TODO(jg): This should check both allowances in case of multisig. It should return imo in which instance we are.
  // 1. ERC20.allowance([wallet, debtManager.address]) < ...
  // 2. Market.allowance([wallet, debtManager.address]) < ...
  const needsApproval = useCallback(
    async (qty: bigint): Promise<boolean> => {
      if (!walletAddress || !market || !debtManager || !opts || qty === 0n) return true;
      try {
        if (!(await isContract(walletAddress))) return false;
        const allowance = await market.read.allowance([walletAddress, debtManager.address], opts);
        return allowance <= qty;
      } catch (e: unknown) {
        setErrorData({ status: true, message: handleOperationError(e) });
        return true;
      }
    },
    [walletAddress, market, debtManager, isContract, opts],
  );

  // TODO(jg): This should approve both ERC20 in case of multisig. Depending on the instance approve 1 or 2.
  // 1. ERC20.approve([debtManager.address, ...])
  // 2. Market.approve([debtManager.address, ...])
  const approve = useCallback(
    async (maxAssets: bigint) => {
      if (!debtManager || !market || !opts) return;

      setIsLoading(true);
      try {
        const max = (maxAssets * 100_005n) / 100_000n;
        const gasEstimation = await market.estimateGas.approve([debtManager.address, max], opts);
        const hash = await market.write.approve([debtManager.address, max], {
          ...opts,
          gasLimit: (gasEstimation * GAS_LIMIT_MULTIPLIER) / WEI_PER_ETHER,
        });
        await waitForTransaction({ hash });
      } catch (e: unknown) {
        setErrorData({ status: true, message: handleOperationError(e) });
      } finally {
        setIsLoading(false);
      }
    },
    [debtManager, market, opts],
  );

  const submit = useCallback(
    async (populate: () => Promise<PopulatedTransaction | undefined>) => {
      if (!walletClient) return;

      setIsLoading(true);

      try {
        const transaction = await populate();
        if (!transaction) return;
        const hash = await walletClient.writeContract(transaction);
        setTx({ status: 'processing', hash });
        const { status, transactionHash } = await waitForTransaction({ hash });
        setTx({ status: status ? 'success' : 'error', hash: transactionHash });

        await refreshAccountData();
      } catch (e: unknown) {
        setErrorData({ status: true, message: handleOperationError(e) });
      } finally {
        setIsLoading(false);
      }
    },
    [walletClient, refreshAccountData],
  );

  const value: ContextValues = {
    isOpen,
    openLeverager,
    close,

    viewSummary,
    setViewSummary: _setViewSummary,
    acceptedTerms,
    setAcceptedTerms,

    input,
    setCollateralSymbol,
    setBorrowSymbol,
    setSecondaryOperation,
    setUserInput,
    setLeverageRatio,
    setSlippage,

    collateralOptions,
    borrowOptions,

    currentLeverageRatio,
    newHealthFactor,
    newCollateral,
    newBorrow,
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

    disabledSubmit,
    disabledConfirm,

    getHealthFactorColor,
    getHealthFactorRisk,

    errorData,
    setErrorData,
    tx,
    isLoading,

    needsApproval,
    approve,
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
