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
import { useSignTypedData, usePublicClient } from 'wagmi';
import { waitForTransaction } from '@wagmi/core';
import {
  formatEther,
  formatUnits,
  Hex,
  parseEther,
  parseUnits,
  pad,
  trim,
  isAddress,
  hexToBigInt,
  keccak256,
  encodeAbiParameters,
} from 'viem';
import { splitSignature } from '@ethersproject/bytes';
import { AbiParametersToPrimitiveTypes, ExtractAbiFunction, ExtractAbiFunctionNames } from 'abitype';

import type { ErrorData } from 'types/Error';
import type { Transaction } from 'types/Transaction';
import useDebtManager from 'hooks/useDebtManager';
import useAccountData, { type MarketAccount } from 'hooks/useAccountData';
import useMarket from 'hooks/useMarket';
import { useWeb3 } from 'hooks/useWeb3';
import type { DebtManager, Market } from 'types/contracts';
import { MAX_UINT256, WEI_PER_ETHER } from 'utils/const';
import handleOperationError from 'utils/handleOperationError';
import useIsContract from 'hooks/useIsContract';
import useBalance from 'hooks/useBalance';
import { useTranslation } from 'react-i18next';
import useAssets from 'hooks/useAssets';
import { useTheme } from '@mui/material';
import formatNumber from 'utils/formatNumber';
import useHealthFactor from 'hooks/useHealthFactor';
import parseHealthFactor from 'utils/parseHealthFactor';
import useERC20 from 'hooks/useERC20';
import usePermit2 from 'hooks/usePermit2';
import dayjs from 'dayjs';
import useDebtPreviewer, { type Limit, type Leverage as LeverageStatus, type Rates } from 'hooks/useDebtPreviewer';
import useDelayedEffect from 'hooks/useDelayedEffect';
import useRewards from 'hooks/useRewards';
import useFloatingPoolAPR from 'hooks/useFloatingPoolAPR';
import { debtManagerABI } from 'types/abi';
import useStETHNativeAPR from 'hooks/useStETHNativeAPR';
import useIsPermit from 'hooks/useIsPermit';
import { gasLimit } from 'utils/gas';

type Params<T extends ExtractAbiFunctionNames<typeof debtManagerABI>> = AbiParametersToPrimitiveTypes<
  ExtractAbiFunction<typeof debtManagerABI, T>['inputs']
>;

type Input = {
  collateralSymbol?: string;
  borrowSymbol?: string;
  secondaryOperation: 'deposit' | 'withdraw';
  userInput: string;
  leverageRatio: number;
};

export type ApprovalStatus = 'INIT' | 'ERC20' | 'ERC20-PERMIT2' | 'MARKET-IN' | 'MARKET-OUT' | 'APPROVED';

const initState: Input = {
  collateralSymbol: undefined,
  borrowSymbol: undefined,
  secondaryOperation: 'deposit',
  userInput: '',
  leverageRatio: 1,
};

const reducer = (state: Input, action: Partial<Input>): Input => {
  return { ...state, ...action };
};

type ContextValues = {
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

  collateralOptions: { symbol: string; value: string }[];
  borrowOptions: { symbol: string; value: string }[];

  currentLeverageRatio: number;
  newHealthFactor?: string;
  deposit: string;
  borrow: string;
  minLeverageRatio: number;
  maxLeverageRatio: number;
  onMax: () => void;
  handleInputChange: (value: string) => void;
  netPosition?: string;
  available?: string;

  loopAPR?: number;
  marketAPR?: number;
  rewardsAPR?: number;
  nativeAPR?: number;

  marketRewards: string[];
  nativeRewards: string[];

  disabledSubmit: boolean;
  disabledConfirm: boolean;
  blockModal: boolean;
  isOverLeveraged: boolean;

  getHealthFactorColor: (healthFactor?: string) => { color: string; bg: string };

  debtManager?: DebtManager;
  market?: Market;

  errorData?: ErrorData;
  setErrorData: React.Dispatch<React.SetStateAction<ErrorData | undefined>>;
  tx?: Transaction;

  isLoading: boolean;
  loadingUserInput: boolean;

  approvalStatus: ApprovalStatus;
  needsApproval: () => Promise<boolean>;
  approve: () => Promise<void>;
  submit: () => Promise<void>;
};

const LeveragerContext = createContext<ContextValues | null>(null);

const minHealthFactorMarkets = (maIn: MarketAccount, maOut: MarketAccount): bigint => {
  if (maIn.asset === maOut.asset) {
    return parseEther('1.02');
  }

  if ([maIn, maOut].every((ma) => ma.assetSymbol.includes('ETH'))) {
    return parseEther('1.03');
  }

  return parseEther('1.05');
};

export const LeveragerContextProvider: FC<PropsWithChildren> = ({ children }) => {
  const { t } = useTranslation();
  const { palette } = useTheme();
  const { walletAddress, chain, opts } = useWeb3();
  const healthFactor = useHealthFactor();
  const { getMarketAccount, refreshAccountData } = useAccountData();
  const isContract = useIsContract();
  const isPermit = useIsPermit();
  const { signTypedDataAsync } = useSignTypedData();
  const publicClient = usePublicClient();
  const [viewSummary, setViewSummary] = useState(false);
  const [errorData, setErrorData] = useState<ErrorData | undefined>();

  const [input, dispatch] = useReducer(reducer, initState);

  const [tx, setTx] = useState<Transaction | undefined>();
  const [isLoading, setIsLoading] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);

  const options = useAssets();
  const { rates } = useRewards();

  const maIn = useMemo(
    () => (input.collateralSymbol ? getMarketAccount(input.collateralSymbol) : undefined),
    [getMarketAccount, input.collateralSymbol],
  );

  const maOut = useMemo(
    () => (input.borrowSymbol ? getMarketAccount(input.borrowSymbol) : undefined),
    [getMarketAccount, input.borrowSymbol],
  );

  const marketIn = useMarket(maIn?.market);
  const marketOut = useMarket(maOut?.market);
  const assetIn = useERC20(maIn?.asset);
  const assetOut = useERC20(maOut?.asset);

  const debtManager = useDebtManager();
  const debtPreviewer = useDebtPreviewer();
  const permit2 = usePermit2();

  const stETHNativeAPR = useStETHNativeAPR();

  const minLeverageRatio = 1;

  const [leverageStatus, setLeverageStatus] = useState<LeverageStatus>();

  const minHealthFactor = useCallback(
    (_maIn: MarketAccount, _maOut: MarketAccount): bigint => {
      const currentHF =
        healthFactor && healthFactor.debt > 0
          ? (healthFactor.collateral * WEI_PER_ETHER) / healthFactor.debt
          : undefined;
      const truncatedHF = currentHF ? (currentHF / 10n ** 13n) * 10n ** 13n : undefined;
      const marketsMinHF = minHealthFactorMarkets(_maIn, _maOut);
      return truncatedHF && truncatedHF < marketsMinHF ? truncatedHF : marketsMinHF;
    },
    [healthFactor],
  );

  const defaultLeverage = useCallback(
    async (cancelled: () => boolean, borrowSymbol: string | undefined = input.borrowSymbol) => {
      if (!debtPreviewer || !walletAddress || !borrowSymbol || !opts) {
        setLeverageStatus(undefined);
        return undefined;
      }

      const _maOut = getMarketAccount(borrowSymbol);
      if (!_maOut) return undefined;

      try {
        const result = await debtPreviewer.read.leverage(
          [_maOut.market, _maOut.market, walletAddress, minHealthFactor(_maOut, _maOut)],
          opts,
        );

        if (cancelled()) return undefined;

        setLeverageStatus(result);
        return result;
      } catch (e: unknown) {
        setLeverageStatus(undefined);
        setErrorData({ status: true, message: handleOperationError(e) });
        return undefined;
      }
    },
    [debtPreviewer, getMarketAccount, input.borrowSymbol, minHealthFactor, opts, walletAddress],
  );

  const walletBalance = useBalance(input.collateralSymbol, maIn?.asset, true);

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
        if (
          ['OP', 'wstETH'].includes(input.collateralSymbol ?? '') &&
          ['OP', 'wstETH'].includes(symbol) &&
          input.collateralSymbol !== symbol
        )
          return [];
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
    [options, getMarketAccount, input.collateralSymbol],
  );

  const { depositAPR } = useFloatingPoolAPR(input.collateralSymbol || 'USDC', undefined, 'deposit');

  const [limit, setLimit] = useState<Limit>();
  const [loopRates, setLoopRates] = useState<Rates>();

  const maxRatio = useMemo(() => {
    const ratio = limit?.maxRatio ?? leverageStatus?.maxRatio ?? 1n;
    return ratio < WEI_PER_ETHER ? WEI_PER_ETHER : ratio;
  }, [leverageStatus?.maxRatio, limit?.maxRatio]);

  const userInput = useMemo(() => {
    if (!maIn) return 0n;
    return parseUnits(input.userInput, maIn.decimals);
  }, [maIn, input.userInput]);

  const [isOverLeveraged, blockModal] = useMemo(() => {
    if (!leverageStatus) return [false, false];
    const _isOverleveraged =
      leverageStatus.ratio > leverageStatus.maxRatio || (leverageStatus.ratio === 0n && leverageStatus.minDeposit > 0n);
    return [_isOverleveraged, _isOverleveraged && leverageStatus.principal < 0n];
  }, [leverageStatus]);

  const preview = useCallback(
    async (cancelled: () => boolean) => {
      if (!debtPreviewer || !maIn || !maOut || !walletAddress || !leverageStatus || !opts) {
        return;
      }

      const _max = leverageStatus.maxRatio ?? 1n;
      const parsedRatio = parseEther(String(input.leverageRatio));
      const ratio = userInput ? parsedRatio : parsedRatio < _max ? parsedRatio : _max;
      const args = [maIn.market, maOut.market, walletAddress, userInput, ratio, minHealthFactor(maIn, maOut)] as const;

      try {
        const _limit =
          input.secondaryOperation === 'deposit'
            ? await debtPreviewer.read.previewLeverage(args, opts)
            : await debtPreviewer.read.previewDeleverage(args, opts);

        const leverageRatesArgs = [
          maIn.market,
          maOut.market,
          walletAddress,
          (input.secondaryOperation === 'deposit' ? 1n : -1n) * userInput,
          ratio,
          parseEther(String(depositAPR)),
          input.collateralSymbol === 'wstETH' ? stETHNativeAPR : 0n,
          input.collateralSymbol === 'wstETH' ? stETHNativeAPR : 0n,
        ] as const;
        const _loopRates = await debtPreviewer.read.leverageRates(leverageRatesArgs, opts);

        if (cancelled()) return;

        setLoopRates(_loopRates);
        setLimit(_limit);
      } catch {
        if (cancelled()) return;
        setLimit(undefined);
        setLoopRates(undefined);
      }
    },
    [
      debtPreviewer,
      depositAPR,
      input.collateralSymbol,
      input.leverageRatio,
      input.secondaryOperation,
      leverageStatus,
      maIn,
      maOut,
      minHealthFactor,
      opts,
      stETHNativeAPR,
      userInput,
      walletAddress,
    ],
  );

  const { isLoading: previewIsLoading } = useDelayedEffect({ effect: preview });

  const newHealthFactor = useMemo(() => {
    if (!healthFactor || !leverageStatus || !maIn || !maOut || !limit) {
      return undefined;
    }

    const depositsUSD = ((limit.deposit - leverageStatus.deposit) * maIn.usdPrice) / 10n ** BigInt(maIn.decimals);

    const borrowsUSD = ((limit.borrow - leverageStatus.borrow) * maOut.usdPrice) / 10n ** BigInt(maOut.decimals);

    const collateral = (depositsUSD * maIn.adjustFactor) / WEI_PER_ETHER;
    const debt = (borrowsUSD * WEI_PER_ETHER) / maOut.adjustFactor;

    return parseHealthFactor(healthFactor.debt + debt, healthFactor.collateral + collateral);
  }, [healthFactor, leverageStatus, limit, maIn, maOut]);

  const setBorrowSymbol = useCallback(
    async (borrowSymbol: string) => {
      setErrorData(undefined);
      const res = await defaultLeverage(() => false, borrowSymbol);
      const _secondaryOperation = res && res.ratio > res.maxRatio ? 'withdraw' : 'deposit';
      const _leverageRatio = res ? Number(res.ratio) / 1e18 : minLeverageRatio;

      dispatch({
        ...initState,
        secondaryOperation: _secondaryOperation,
        collateralSymbol: borrowSymbol,
        borrowSymbol: borrowSymbol,
        leverageRatio: Math.max(_leverageRatio, 1),
      });
    },
    [defaultLeverage],
  );

  const setCollateralSymbol = useCallback(
    (collateralSymbol: string) => setBorrowSymbol(collateralSymbol),
    [setBorrowSymbol],
  );

  const setSecondaryOperation = useCallback((secondaryOperation: 'deposit' | 'withdraw') => {
    setErrorData(undefined);
    dispatch({ secondaryOperation, userInput: '' });
  }, []);

  const setUserInput = useCallback((_userInput: string) => {
    setErrorData(undefined);
    dispatch({ userInput: _userInput });
  }, []);

  const principal = useMemo(() => {
    return limit?.principal ?? leverageStatus?.principal ?? 0n;
  }, [leverageStatus?.principal, limit?.principal]);

  const available = useMemo(() => {
    if (input.secondaryOperation === 'deposit') {
      return walletBalance;
    }
    return formatUnits(leverageStatus?.maxWithdraw ?? limit?.principal ?? 0n, maIn?.decimals ?? 18);
  }, [input.secondaryOperation, leverageStatus?.maxWithdraw, limit?.principal, maIn?.decimals, walletBalance]);

  const deposit = useMemo(() => {
    return formatUnits(limit?.deposit ?? leverageStatus?.deposit ?? 0n, maIn?.decimals ?? 18);
  }, [leverageStatus?.deposit, limit?.deposit, maIn?.decimals]);

  const borrow = useMemo(() => {
    return formatUnits(limit?.borrow ?? leverageStatus?.borrow ?? 0n, maOut?.decimals ?? 18);
  }, [leverageStatus?.borrow, limit?.borrow, maOut?.decimals]);

  const netPosition = useMemo(() => {
    return formatUnits(principal ?? 0n, maIn?.decimals ?? 18);
  }, [maIn?.decimals, principal]);

  const currentLeverageRatio = useMemo(
    () =>
      leverageStatus
        ? Number(leverageStatus.ratio < WEI_PER_ETHER ? WEI_PER_ETHER : leverageStatus.ratio) / 1e18
        : minLeverageRatio,
    [leverageStatus],
  );

  const _setViewSummary = useCallback((_state: boolean) => {
    setAcceptedTerms(false);
    setViewSummary(_state);
  }, []);

  const setLeverageRatio = useCallback(
    (leverageRatio: number) => {
      const _secondaryOperation = leverageRatio < currentLeverageRatio ? 'withdraw' : 'deposit';
      const changedOperation = _secondaryOperation !== input.secondaryOperation;
      setErrorData(undefined);

      const _leverageRatio = Math.max(leverageRatio, 1);

      dispatch({
        leverageRatio: _leverageRatio,
        secondaryOperation: _secondaryOperation,
        userInput: changedOperation ? '' : input.userInput,
      });
    },
    [currentLeverageRatio, input.secondaryOperation, input.userInput],
  );

  const onMax = useCallback(() => {
    setErrorData(undefined);
    if (input.secondaryOperation === 'deposit' && walletBalance) {
      return setUserInput(walletBalance);
    }
    setUserInput(formatUnits(leverageStatus?.maxWithdraw ?? 0n, maIn?.decimals ?? 18));
  }, [input.secondaryOperation, leverageStatus?.maxWithdraw, maIn?.decimals, setUserInput, walletBalance]);

  const handleInputChange = useCallback(
    (value: string) => {
      setUserInput(value);

      const parsed = parseUnits(value, maIn?.decimals ?? 18);

      if (input.secondaryOperation === 'deposit') {
        if (walletBalance && Number(value) > Number(walletBalance)) {
          return setErrorData({ status: true, message: t('Insufficient balance') });
        }
      } else {
        if (principal !== undefined && parsed > principal) {
          return setErrorData({ status: true, message: t('Insufficient funds') });
        }
      }

      setErrorData(undefined);
    },
    [setUserInput, maIn?.decimals, input.secondaryOperation, walletBalance, t, principal],
  );

  const [loopAPR, marketAPR, rewardsAPR, nativeAPR] = useMemo(() => {
    if (!input.collateralSymbol || !input.borrowSymbol || !loopRates) {
      return [undefined, undefined, undefined, undefined];
    }

    const _marketAPR = Number(loopRates.deposit - loopRates.borrow) / 1e18;

    const _rewardsAPR =
      Number(loopRates.rewards.reduce((_rate, reward) => _rate + reward.deposit + reward.borrow, 0n)) / 1e18;

    const _nativeAPR = Number(loopRates.native) / 1e18;

    const _loopAPR = _marketAPR + _rewardsAPR + _nativeAPR;

    return [_loopAPR, _marketAPR, _rewardsAPR, _nativeAPR];
  }, [input.borrowSymbol, input.collateralSymbol, loopRates]);

  const marketRewards = useMemo(() => {
    if (!input.collateralSymbol || !input.borrowSymbol) return [];

    const collateralRewards = rates[input.collateralSymbol]?.map((r) => r.assetSymbol) ?? [];
    const borrowRewards = rates[input.borrowSymbol]?.map((r) => r.assetSymbol) ?? [];
    return [...new Set([...collateralRewards, ...borrowRewards])];
  }, [input.borrowSymbol, input.collateralSymbol, rates]);

  const nativeRewards = useMemo(
    () => (input.collateralSymbol === 'wstETH' ? ['wstETH'] : []),
    [input.collateralSymbol],
  );

  const disabledSubmit = useMemo(
    () =>
      !input.collateralSymbol ||
      !input.borrowSymbol ||
      errorData?.status ||
      (currentLeverageRatio === input.leverageRatio && !input.userInput) ||
      (principal ?? -1n) <= 0n ||
      !leverageStatus ||
      previewIsLoading ||
      blockModal,
    [
      input.collateralSymbol,
      input.borrowSymbol,
      input.leverageRatio,
      input.userInput,
      errorData?.status,
      currentLeverageRatio,
      principal,
      leverageStatus,
      previewIsLoading,
      blockModal,
    ],
  );

  const disabledConfirm = useMemo(() => disabledSubmit || !acceptedTerms, [acceptedTerms, disabledSubmit]);

  const getHealthFactorColor = useCallback(
    (_healthFactor?: string) => {
      if (!_healthFactor || !maIn || !maOut)
        return { color: palette.healthFactor.safe, bg: palette.healthFactor.bg.safe };
      const parsedHF = parseFloat(_healthFactor);
      const status =
        parsedHF <= Number(minHealthFactor(maIn, maOut)) / 1e18 ? 'danger' : parsedHF < 1.25 ? 'warning' : 'safe';
      return { color: palette.healthFactor[status], bg: palette.healthFactor.bg[status] };
    },
    [maIn, maOut, minHealthFactor, palette.healthFactor],
  );

  const [approvalStatus, setApprovalStatus] = useState<ApprovalStatus>('INIT');
  const needsApproval = useCallback(async (): Promise<boolean> => {
    if (
      !input.collateralSymbol ||
      !input.borrowSymbol ||
      !maIn ||
      !walletAddress ||
      !marketIn ||
      !marketOut ||
      !assetIn ||
      !permit2 ||
      !debtManager ||
      !limit ||
      !opts ||
      !leverageStatus
    ) {
      return true;
    }

    setApprovalStatus('INIT');
    try {
      if (await isContract(walletAddress)) {
        if (input.secondaryOperation === 'deposit') {
          setApprovalStatus('ERC20');
          const assetAllowance = await assetIn.read.allowance([walletAddress, debtManager.address], opts);
          if (assetAllowance < userInput) return true;

          setApprovalStatus('MARKET-OUT');
          const marketOutAllownce = await marketOut.read.allowance([walletAddress, debtManager.address], opts);
          const _slippage = (leverageStatus.borrow * ((maIn.floatingBorrowRate * 300n) / 31_536_000n)) / WEI_PER_ETHER;
          const borrowShares = await marketIn.read.previewWithdraw(
            [limit.borrow - leverageStatus.borrow + _slippage],
            opts,
          );
          if (marketOutAllownce < borrowShares) return true;
        } else {
          setApprovalStatus('MARKET-IN');
          const marketInAllowance = await marketIn.read.allowance([walletAddress, debtManager.address], opts);
          const _slippage =
            (maIn.floatingBorrowAssets * ((maIn.floatingBorrowRate * 300n) / 31_536_000n)) / WEI_PER_ETHER;
          const permitShares = await marketIn.read.previewWithdraw(
            [
              (maIn.floatingBorrowAssets < limit.borrow ? 0n : maIn.floatingBorrowAssets - limit.borrow) +
                userInput +
                _slippage,
            ],
            opts,
          );
          if (marketInAllowance < permitShares) return true;
        }

        setApprovalStatus('APPROVED');
        return false;
      }

      if (!(await isPermit(maIn.asset)) && input.secondaryOperation === 'deposit') {
        setApprovalStatus('ERC20-PERMIT2');
        const allowance = await assetIn.read.allowance([walletAddress, permit2.address], opts);
        if (allowance < userInput) return true;
      }

      setApprovalStatus('APPROVED');
      return false;
    } catch (e: unknown) {
      setErrorData({ status: true, message: handleOperationError(e) });
      return true;
    }
  }, [
    input.collateralSymbol,
    input.borrowSymbol,
    input.secondaryOperation,
    maIn,
    walletAddress,
    marketIn,
    marketOut,
    assetIn,
    permit2,
    debtManager,
    limit,
    opts,
    leverageStatus,
    isContract,
    isPermit,
    userInput,
  ]);

  const approve = useCallback(async () => {
    if (!debtManager || !maIn || !marketIn || !marketOut || !assetIn || !permit2 || !limit || !opts || !leverageStatus)
      return;

    setIsLoading(true);
    try {
      let hash: Hex | undefined;
      switch (approvalStatus) {
        case 'ERC20': {
          const args = [debtManager.address, userInput] as const;
          const gasEstimation = await assetIn.estimateGas.approve(args, opts);
          hash = await assetIn.write.approve(args, {
            ...opts,
            gasLimit: gasLimit(gasEstimation),
          });
          break;
        }
        case 'ERC20-PERMIT2': {
          const args = [permit2.address, MAX_UINT256] as const;
          const gasEstimation = await assetIn.estimateGas.approve(args, opts);
          hash = await assetIn.write.approve(args, {
            ...opts,
            gasLimit: gasLimit(gasEstimation),
          });
          break;
        }
        case 'MARKET-IN': {
          const _slippage =
            (maIn.floatingBorrowAssets * ((maIn.floatingBorrowRate * 5000n) / 31_536_000n)) / WEI_PER_ETHER;
          const permitShares = await marketIn.read.previewWithdraw(
            [
              (maIn.floatingBorrowAssets < limit.borrow ? 0n : maIn.floatingBorrowAssets - limit.borrow) +
                userInput +
                _slippage,
            ],
            opts,
          );
          const args = [debtManager.address, permitShares] as const;
          const gasEstimation = await marketIn.estimateGas.approve(args, opts);
          hash = await marketIn.write.approve(args, {
            ...opts,
            gasLimit: gasLimit(gasEstimation),
          });
          break;
        }
        case 'MARKET-OUT': {
          const _slippage = (leverageStatus.borrow * ((maIn.floatingBorrowRate * 5000n) / 31_536_000n)) / WEI_PER_ETHER;
          const borrowShares = await marketIn.read.previewWithdraw(
            [limit.borrow - leverageStatus.borrow + _slippage],
            opts,
          );
          const args = [debtManager.address, borrowShares] as const;
          const gasEstimation = await marketOut.estimateGas.approve(args, opts);
          hash = await marketOut.write.approve(args, {
            ...opts,
            gasLimit: gasLimit(gasEstimation),
          });
          break;
        }
        default:
          return;
      }

      if (!hash) return;
      await waitForTransaction({ hash });
    } catch (e: unknown) {
      setErrorData({ status: true, message: handleOperationError(e) });
    } finally {
      setIsLoading(false);
    }
  }, [
    approvalStatus,
    assetIn,
    debtManager,
    leverageStatus,
    limit,
    maIn,
    marketIn,
    marketOut,
    opts,
    permit2,
    userInput,
  ]);

  const signPermit = useCallback(
    async (value: bigint, who: 'assetIn' | 'marketIn' | 'marketOut') => {
      if (!walletAddress || !maIn || !marketIn || !marketOut || !assetIn || !permit2 || !debtManager) return;

      const deadline = BigInt(dayjs().unix() + 3_600);
      const permitAllowed = await isPermit(assetIn.address);

      if (who === 'assetIn' && !permitAllowed) {
        const signature = await signTypedDataAsync({
          primaryType: 'PermitTransferFrom',
          domain: {
            name: 'Permit2',
            chainId: chain.id,
            verifyingContract: permit2.address,
          },
          types: {
            PermitTransferFrom: [
              { name: 'permitted', type: 'TokenPermissions' },
              { name: 'spender', type: 'address' },
              { name: 'nonce', type: 'uint256' },
              { name: 'deadline', type: 'uint256' },
            ],
            TokenPermissions: [
              { name: 'token', type: 'address' },
              { name: 'amount', type: 'uint256' },
            ],
          },
          message: {
            permitted: {
              token: assetIn.address,
              amount: value,
            },
            spender: debtManager.address,
            deadline,
            nonce: hexToBigInt(
              keccak256(
                encodeAbiParameters(
                  [
                    { name: 'sender', type: 'address' },
                    { name: 'token', type: 'address' },
                    { name: 'assets', type: 'uint256' },
                    { name: 'deadline', type: 'uint256' },
                  ],
                  [walletAddress, assetIn.address, value, deadline],
                ),
              ),
            ),
          },
        });

        const permit = {
          deadline,
          signature,
        } as const;

        return { type: 'permit2', value: permit } as const;
      }

      const [impl, nonce] = await Promise.all([
        who.startsWith('market')
          ? publicClient.getStorageAt({
              address: who === 'marketIn' ? marketIn.address : marketOut.address,
              slot: '0x360894a13ba1a3210667c828492db98dca3e2076cc3735a920a3ca505d382bbc',
            })
          : assetIn.address,
        who.startsWith('market')
          ? (who === 'marketIn' ? marketIn : marketOut).read.nonces([walletAddress], opts)
          : assetIn.read.nonces([walletAddress], opts),
      ]);

      if (!impl) return;
      const verifyingContract = pad(trim(impl), { size: 20 });
      if (!isAddress(verifyingContract)) return;

      const { v, r, s } = await signTypedDataAsync({
        primaryType: 'Permit',
        domain: {
          name: who.startsWith('market') ? '' : await assetIn.read.name(opts),
          version: '1',
          chainId: chain.id,
          verifyingContract,
        },
        types: {
          Permit: [
            { name: 'owner', type: 'address' },
            { name: 'spender', type: 'address' },
            { name: 'value', type: 'uint256' },
            { name: 'nonce', type: 'uint256' },
            { name: 'deadline', type: 'uint256' },
          ],
        },
        message: {
          owner: walletAddress,
          spender: debtManager.address,
          value,
          nonce,
          deadline,
        },
      }).then(splitSignature);

      const permit = {
        account: walletAddress,
        value,
        deadline,
        ...{ v, r: r as Hex, s: s as Hex },
      } as const;

      return { type: 'permit', value: permit } as const;
    },
    [
      assetIn,
      chain.id,
      debtManager,
      isPermit,
      maIn,
      marketIn,
      marketOut,
      opts,
      permit2,
      publicClient,
      signTypedDataAsync,
      walletAddress,
    ],
  );

  const submit = useCallback(async () => {
    if (
      !walletAddress ||
      !input.collateralSymbol ||
      !input.borrowSymbol ||
      !debtManager ||
      !marketIn ||
      !marketOut ||
      !assetIn ||
      !assetOut ||
      !maIn ||
      !maOut ||
      !leverageStatus ||
      !limit ||
      !opts
    ) {
      return;
    }

    setIsLoading(true);
    try {
      const ratio = parseEther(String(input.leverageRatio));
      const isMultiSig = await isContract(walletAddress);

      let hash: Hex | undefined;

      if (input.collateralSymbol === input.borrowSymbol) {
        switch (input.secondaryOperation) {
          case 'deposit': {
            let args: Params<'leverage'> = [marketIn.address, userInput, ratio];

            if (isMultiSig) {
              const gasEstimation = await debtManager.estimateGas.leverage(args, opts);
              hash = await debtManager.write.leverage(args, {
                ...opts,
                gasLimit: gasLimit(gasEstimation),
              });
              break;
            }

            const _slippage =
              (leverageStatus.borrow * ((maIn.floatingBorrowRate * 300n) / 31_536_000n)) / WEI_PER_ETHER;
            const borrowShares = await marketIn.read.previewWithdraw(
              [limit.borrow - leverageStatus.borrow + _slippage],
              opts,
            );
            const [assetPermit, marketPermit] = await Promise.all([
              signPermit(userInput, 'assetIn'),
              signPermit(borrowShares, 'marketIn'),
            ]);

            if (!assetPermit || !marketPermit || marketPermit.type === 'permit2') {
              return;
            }

            switch (assetPermit.type) {
              case 'permit': {
                const _args = [marketIn.address, ratio, marketPermit.value, assetPermit.value] as const;
                const gasEstimation = await debtManager.estimateGas.leverage(_args, opts);
                hash = await debtManager.write.leverage(_args, {
                  ...opts,
                  gasLimit: gasLimit(gasEstimation),
                });
                break;
              }
              case 'permit2': {
                args = [...args, marketPermit.value, assetPermit.value];
                const gasEstimation = await debtManager.estimateGas.leverage(args, opts);
                hash = await debtManager.write.leverage(args, {
                  ...opts,
                  gasLimit: gasLimit(gasEstimation),
                });
                break;
              }
            }
            break;
          }
          case 'withdraw': {
            const args: Params<'deleverage'> = [marketIn.address, userInput, ratio] as const;

            if (isMultiSig) {
              const gasEstimation = await debtManager.estimateGas.deleverage(args, opts);
              hash = await debtManager.write.deleverage(args, {
                ...opts,
                gasLimit: gasLimit(gasEstimation),
              });
              break;
            }

            const _slippage =
              (maIn.floatingBorrowAssets * ((maIn.floatingBorrowRate * 300n) / 31_536_000n)) / WEI_PER_ETHER;
            const permitShares = await marketIn.read.previewWithdraw(
              [
                (maIn.floatingBorrowAssets < limit.borrow ? 0n : maIn.floatingBorrowAssets - limit.borrow) +
                  userInput +
                  _slippage,
              ],
              opts,
            );
            const marketPermit = await signPermit(permitShares, 'marketIn');

            if (!marketPermit || marketPermit.type === 'permit2') {
              return;
            }

            const _args = [marketIn.address, userInput, ratio, marketPermit.value] as const;
            const gasEstimation = await debtManager.estimateGas.deleverage(_args, opts);
            hash = await debtManager.write.deleverage(_args, {
              ...opts,
              gasLimit: gasLimit(gasEstimation),
            });
            break;
          }
        }
      }

      if (!hash) return;

      setTx({ status: 'processing', hash });
      const { status, transactionHash } = await waitForTransaction({ hash });
      setTx({ status: status ? 'success' : 'error', hash: transactionHash });

      await refreshAccountData();
    } catch (e: unknown) {
      setErrorData({ status: true, message: handleOperationError(e) });
    } finally {
      setIsLoading(false);
    }
  }, [
    walletAddress,
    input.collateralSymbol,
    input.borrowSymbol,
    input.leverageRatio,
    input.secondaryOperation,
    debtManager,
    marketIn,
    marketOut,
    assetIn,
    assetOut,
    maIn,
    maOut,
    leverageStatus,
    limit,
    opts,
    isContract,
    refreshAccountData,
    userInput,
    signPermit,
  ]);

  const value: ContextValues = {
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

    collateralOptions,
    borrowOptions,

    currentLeverageRatio,
    newHealthFactor,
    deposit,
    borrow,
    netPosition,
    minLeverageRatio,
    maxLeverageRatio: Number(maxRatio) / 1e18,
    onMax,
    handleInputChange,
    available,

    loopAPR,
    marketAPR,
    rewardsAPR,
    nativeAPR,

    marketRewards,
    nativeRewards,

    debtManager,
    market: marketIn,

    disabledSubmit,
    disabledConfirm,
    blockModal,
    isOverLeveraged,

    getHealthFactorColor,

    errorData,
    setErrorData,
    tx,
    isLoading: isLoading,
    loadingUserInput: previewIsLoading,

    approvalStatus,
    needsApproval,
    approve,
    submit,
  };

  return <LeveragerContext.Provider value={value}>{children}</LeveragerContext.Provider>;
};

export function useLeveragerContext() {
  const ctx = useContext(LeveragerContext);
  if (!ctx) {
    throw new Error('Using LeveragerContext outside of provider');
  }
  return ctx;
}

export default LeveragerContext;
