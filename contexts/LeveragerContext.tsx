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
import { useSendCalls, useSignTypedData, usePublicClient } from 'wagmi';
import { readContract, waitForCallsStatus } from '@wagmi/core';
import {
  erc20Abi,
  formatEther,
  formatUnits,
  Hex,
  parseEther,
  parseUnits,
  pad,
  trim,
  isAddress,
  hexToBigInt,
  hexToSignature,
  keccak256,
  encodeAbiParameters,
} from 'viem';
import { AbiParametersToPrimitiveTypes, ExtractAbiFunction, ExtractAbiFunctionNames } from 'abitype';
import { MAX_UINT256, WAD } from '@exactly/lib';

import type { ErrorData } from 'types/Error';
import type { Transaction } from 'types/Transaction';
import usePreviewerExactly, { type MarketAccount } from 'hooks/usePreviewerExactly';
import handleOperationError from 'utils/handleOperationError';
import useIsContract from 'hooks/useIsContract';
import useBalance from 'hooks/useBalance';
import { useTranslation } from 'react-i18next';
import useAssets from 'hooks/useAssets';
import { useTheme } from '@mui/material';
import formatNumber from 'utils/formatNumber';
import useHealthFactor from 'hooks/useHealthFactor';
import parseHealthFactor from 'utils/parseHealthFactor';
import dayjs from 'dayjs';
import { type Limit, type Leverage as LeverageStatus, type Rates } from 'hooks/useDebtPreviewer';
import useDelayedEffect from 'hooks/useDelayedEffect';
import useRewards from 'hooks/useRewards';
import useFloatingPoolAPR from 'hooks/useFloatingPoolAPR';
import {
  debtManagerAbi,
  debtManagerAddress,
  debtPreviewerAbi,
  debtPreviewerAddress,
  marketAbi,
  permit2Address,
} from 'generated/wagmi';
import useStETHNativeAPR from 'hooks/useStETHNativeAPR';
import useIsPermit from 'hooks/useIsPermit';
import useContractVersion from 'hooks/useContractVersion';
import { defaultChain, wagmi } from 'utils/client';
import useReadOnly from 'hooks/useReadOnly';

type Params<T extends ExtractAbiFunctionNames<typeof debtManagerAbi>> = AbiParametersToPrimitiveTypes<
  ExtractAbiFunction<typeof debtManagerAbi, T>['inputs']
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
  const { account: walletAddress } = useReadOnly();
  const healthFactor = useHealthFactor();
  const { data, refetch } = usePreviewerExactly();
  const getMarketAccount = useCallback(
    (symbol: string) => data?.find((market) => market.assetSymbol === symbol),
    [data],
  );
  const isContract = useIsContract();
  const isPermit = useIsPermit();
  const { signTypedDataAsync } = useSignTypedData();
  const publicClient = usePublicClient();
  const { mutateAsync: sendCalls, isPending: sendCallsPending } = useSendCalls();
  const [viewSummary, setViewSummary] = useState(false);
  const [errorData, setErrorData] = useState<ErrorData | undefined>();

  const [input, dispatch] = useReducer(reducer, initState);

  const [tx, setTx] = useState<Transaction | undefined>();
  const [submitting, setSubmitting] = useState(false);
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

  const marketIn = maIn?.market;
  const marketOut = maOut?.market;
  const assetIn = maIn?.asset;
  const assetOut = maOut?.asset;

  const debtManager = Object.entries(debtManagerAddress).find(([chainId]) => Number(chainId) === defaultChain.id)?.[1];
  const debtPreviewer = Object.entries(debtPreviewerAddress).find(
    ([chainId]) => Number(chainId) === defaultChain.id,
  )?.[1];
  const permit2 = Object.entries(permit2Address).find(([chainId]) => Number(chainId) === defaultChain.id)?.[1];

  const stETHNativeAPR = useStETHNativeAPR();

  const minLeverageRatio = 1;
  const contractVersion = useContractVersion();

  const [leverageStatus, setLeverageStatus] = useState<LeverageStatus>();

  const minHealthFactor = useCallback(
    (_maIn: MarketAccount, _maOut: MarketAccount): bigint => {
      const currentHF =
        healthFactor && healthFactor.debt > 0 ? (healthFactor.collateral * WAD) / healthFactor.debt : undefined;
      const truncatedHF = currentHF ? (currentHF / 10n ** 13n) * 10n ** 13n : undefined;
      const marketsMinHF = minHealthFactorMarkets(_maIn, _maOut);
      return truncatedHF && truncatedHF < marketsMinHF ? truncatedHF : marketsMinHF;
    },
    [healthFactor],
  );

  const defaultLeverage = useCallback(
    async (cancelled: () => boolean, borrowSymbol: string | undefined = input.borrowSymbol) => {
      if (!debtPreviewer || !walletAddress || !borrowSymbol) {
        setLeverageStatus(undefined);
        return undefined;
      }

      const _maOut = getMarketAccount(borrowSymbol);
      if (!_maOut) return undefined;

      try {
        const result = await readContract(wagmi, {
          account: walletAddress,
          address: debtPreviewer,
          abi: debtPreviewerAbi,
          functionName: 'leverage',
          chainId: defaultChain.id,
          args: [_maOut.market, _maOut.market, walletAddress, minHealthFactor(_maOut, _maOut)],
        });

        if (cancelled()) return undefined;

        setLeverageStatus(result);
        return result;
      } catch (e: unknown) {
        setLeverageStatus(undefined);
        setErrorData({ status: true, message: handleOperationError(e) });
        return undefined;
      }
    },
    [debtPreviewer, getMarketAccount, input.borrowSymbol, minHealthFactor, walletAddress],
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
    return ratio < WAD ? WAD : ratio;
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
      if (!debtPreviewer || !maIn || !maOut || !walletAddress || !leverageStatus) {
        return;
      }

      const _max = leverageStatus.maxRatio ?? 1n;
      const parsedRatio = parseEther(String(input.leverageRatio));
      const ratio = userInput ? parsedRatio : parsedRatio < _max ? parsedRatio : _max;
      const args = [maIn.market, maOut.market, walletAddress, userInput, ratio, minHealthFactor(maIn, maOut)] as const;

      try {
        const _limit =
          input.secondaryOperation === 'deposit'
            ? await readContract(wagmi, {
                account: walletAddress,
                address: debtPreviewer,
                abi: debtPreviewerAbi,
                functionName: 'previewLeverage',
                chainId: defaultChain.id,
                args,
              })
            : await readContract(wagmi, {
                account: walletAddress,
                address: debtPreviewer,
                abi: debtPreviewerAbi,
                functionName: 'previewDeleverage',
                chainId: defaultChain.id,
                args,
              });

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
        const _loopRates = await readContract(wagmi, {
          account: walletAddress,
          address: debtPreviewer,
          abi: debtPreviewerAbi,
          functionName: 'leverageRates',
          chainId: defaultChain.id,
          args: leverageRatesArgs,
        });

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

    const collateral = (depositsUSD * maIn.adjustFactor) / WAD;
    const debt = (borrowsUSD * WAD) / maOut.adjustFactor;

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
    (collateralSymbol: string) => {
      const marketAccount = getMarketAccount(collateralSymbol);
      setBorrowSymbol(collateralSymbol);
      if (marketAccount && !marketAccount.isCollateral) {
        return setErrorData({ status: true, message: t('Please set this asset as collateral in your dashboard') });
      }
    },
    [getMarketAccount, setBorrowSymbol, t],
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
    () => (leverageStatus ? Number(leverageStatus.ratio < WAD ? WAD : leverageStatus.ratio) / 1e18 : minLeverageRatio),
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
      !leverageStatus ||
      !publicClient
    ) {
      return true;
    }

    setApprovalStatus('INIT');
    try {
      if (await isContract(walletAddress)) {
        if (input.secondaryOperation === 'deposit') {
          setApprovalStatus('ERC20');
          const assetAllowance = await publicClient.readContract({
            address: assetIn,
            abi: erc20Abi,
            functionName: 'allowance',
            args: [walletAddress, debtManager],
            account: walletAddress,
          });
          if (assetAllowance < userInput) return true;

          setApprovalStatus('MARKET-OUT');
          const marketOutAllownce = await publicClient.readContract({
            address: marketOut,
            abi: erc20Abi,
            functionName: 'allowance',
            args: [walletAddress, debtManager],
            account: walletAddress,
          });
          const _slippage = (leverageStatus.borrow * ((maIn.floatingBorrowRate * 300n) / 31_536_000n)) / WAD;
          const borrowShares = await publicClient.readContract({
            address: marketIn,
            abi: marketAbi,
            functionName: 'previewWithdraw',
            args: [limit.borrow - leverageStatus.borrow + _slippage],
            account: walletAddress,
          });
          if (marketOutAllownce < borrowShares) return true;
        } else {
          setApprovalStatus('MARKET-IN');
          const marketInAllowance = await publicClient.readContract({
            address: marketIn,
            abi: erc20Abi,
            functionName: 'allowance',
            args: [walletAddress, debtManager],
            account: walletAddress,
          });
          const _slippage = (maIn.floatingBorrowAssets * ((maIn.floatingBorrowRate * 300n) / 31_536_000n)) / WAD;
          const permitShares = await publicClient.readContract({
            address: marketIn,
            abi: marketAbi,
            functionName: 'previewWithdraw',
            args: [
              (maIn.floatingBorrowAssets < limit.borrow ? 0n : maIn.floatingBorrowAssets - limit.borrow) +
                userInput +
                _slippage,
            ],
            account: walletAddress,
          });
          if (marketInAllowance < permitShares) return true;
        }

        setApprovalStatus('APPROVED');
        return false;
      }

      if (!(await isPermit(maIn.asset)) && input.secondaryOperation === 'deposit') {
        setApprovalStatus('ERC20-PERMIT2');
        const allowance = await publicClient.readContract({
          address: assetIn,
          abi: erc20Abi,
          functionName: 'allowance',
          args: [walletAddress, permit2],
          account: walletAddress,
        });
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
    leverageStatus,
    publicClient,
    isContract,
    isPermit,
    userInput,
  ]);

  const sendApprove = useCallback(
    async (token: `0x${string}`, spender: `0x${string}`, amount: bigint) => {
      if (!walletAddress) return;
      const { id } = await sendCalls({
        chainId: defaultChain.id,
        experimental_fallback: true,
        calls: [{ to: token, abi: erc20Abi, functionName: 'approve', args: [spender, amount] }],
      });
      await waitForCallsStatus(wagmi, { id });
    },
    [sendCalls, walletAddress],
  );

  const approve = useCallback(async () => {
    if (
      !debtManager ||
      !maIn ||
      !marketIn ||
      !marketOut ||
      !assetIn ||
      !permit2 ||
      !limit ||
      !walletAddress ||
      !leverageStatus ||
      !publicClient
    )
      return;

    try {
      switch (approvalStatus) {
        case 'ERC20': {
          await sendApprove(assetIn, debtManager, userInput);
          break;
        }
        case 'ERC20-PERMIT2': {
          await sendApprove(assetIn, permit2, MAX_UINT256);
          break;
        }
        case 'MARKET-IN': {
          const _slippage = (maIn.floatingBorrowAssets * ((maIn.floatingBorrowRate * 5000n) / 31_536_000n)) / WAD;
          const permitShares = await publicClient.readContract({
            address: marketIn,
            abi: marketAbi,
            functionName: 'previewWithdraw',
            args: [
              (maIn.floatingBorrowAssets < limit.borrow ? 0n : maIn.floatingBorrowAssets - limit.borrow) +
                userInput +
                _slippage,
            ],
            account: walletAddress,
          });
          await sendApprove(marketIn, debtManager, permitShares);
          break;
        }
        case 'MARKET-OUT': {
          const _slippage = (leverageStatus.borrow * ((maIn.floatingBorrowRate * 3_600n * 12n) / 31_536_000n)) / WAD;
          const borrowShares = await publicClient.readContract({
            address: marketIn,
            abi: marketAbi,
            functionName: 'previewWithdraw',
            args: [limit.borrow - leverageStatus.borrow + _slippage],
            account: walletAddress,
          });
          await sendApprove(marketOut, debtManager, borrowShares);
          break;
        }
        default:
          return;
      }
    } catch (e: unknown) {
      setErrorData({ status: true, message: handleOperationError(e) });
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
    permit2,
    publicClient,
    sendApprove,
    userInput,
    walletAddress,
  ]);

  const signPermit = useCallback(
    async (value: bigint, who: 'assetIn' | 'marketIn' | 'marketOut') => {
      if (!walletAddress || !maIn || !marketIn || !marketOut || !assetIn || !permit2 || !debtManager || !publicClient) {
        return;
      }

      const deadline = BigInt(dayjs().unix() + 3_600);
      const permitAllowed = await isPermit(assetIn);

      if (who === 'assetIn' && !permitAllowed) {
        const signature = await signTypedDataAsync({
          primaryType: 'PermitTransferFrom',
          domain: {
            name: 'Permit2',
            chainId: defaultChain.id,
            verifyingContract: permit2,
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
              token: assetIn,
              amount: value,
            },
            spender: debtManager,
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
                  [walletAddress, assetIn, value, deadline],
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

      const tokenAddress = who === 'marketIn' ? marketIn : who === 'marketOut' ? marketOut : assetIn;
      const [impl, nonce] = await Promise.all([
        who.startsWith('market')
          ? publicClient.getStorageAt({
              address: tokenAddress,
              slot: '0x360894a13ba1a3210667c828492db98dca3e2076cc3735a920a3ca505d382bbc',
            })
          : assetIn,
        publicClient.readContract({
          address: tokenAddress,
          abi: erc20PermitAbi,
          functionName: 'nonces',
          args: [walletAddress],
          account: walletAddress,
        }),
      ]);

      if (!impl) return;
      const verifyingContract = pad(trim(impl as Hex), { size: 20 });
      if (!isAddress(verifyingContract)) return;

      const name = who.startsWith('market')
        ? ''
        : await publicClient.readContract({
            address: assetIn,
            abi: erc20Abi,
            functionName: 'name',
            account: walletAddress,
          });

      const { v, r, s } = await signTypedDataAsync({
        primaryType: 'Permit',
        domain: {
          name,
          version: await contractVersion(verifyingContract),
          chainId: defaultChain.id,
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
          spender: debtManager,
          value,
          nonce,
          deadline,
        },
      }).then(hexToSignature);

      const permit = {
        account: walletAddress,
        value,
        deadline,
        ...{ v: Number(v), r, s },
      } as const;

      return { type: 'permit', value: permit } as const;
    },
    [
      assetIn,
      contractVersion,
      debtManager,
      isPermit,
      maIn,
      marketIn,
      marketOut,
      permit2,
      publicClient,
      signTypedDataAsync,
      walletAddress,
    ],
  );

  const sendLeverage = useCallback(
    async <T extends 'leverage' | 'deleverage'>(functionName: T, args: Params<T>) => {
      if (!walletAddress || !debtManager) return;
      const { id } = await sendCalls({
        chainId: defaultChain.id,
        experimental_fallback: true,
        calls: [{ to: debtManager, abi: debtManagerAbi, functionName, args } as never],
      });
      const { receipts, status } = await waitForCallsStatus(wagmi, { id });
      return { hash: receipts?.[receipts.length - 1]?.transactionHash, status };
    },
    [debtManager, sendCalls, walletAddress],
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
      !publicClient
    ) {
      return;
    }

    setSubmitting(true);
    try {
      const ratio = parseEther(String(input.leverageRatio));
      const isMultiSig = await isContract(walletAddress);

      let result: { hash?: Hex; status: string | undefined } | undefined;

      if (input.collateralSymbol === input.borrowSymbol) {
        switch (input.secondaryOperation) {
          case 'deposit': {
            const args: Params<'leverage'> = [marketIn, userInput, ratio];

            if (isMultiSig) {
              result = await sendLeverage('leverage', args);
              break;
            }

            const _slippage = (leverageStatus.borrow * ((maIn.floatingBorrowRate * 300n) / 31_536_000n)) / WAD;
            const borrowShares = await publicClient.readContract({
              address: marketIn,
              abi: marketAbi,
              functionName: 'previewWithdraw',
              args: [limit.borrow - leverageStatus.borrow + _slippage],
              account: walletAddress,
            });
            const [assetPermit, marketPermit] = await Promise.all([
              signPermit(userInput, 'assetIn'),
              signPermit(borrowShares, 'marketIn'),
            ]);

            if (!assetPermit || !marketPermit || marketPermit.type === 'permit2') {
              return;
            }

            switch (assetPermit.type) {
              case 'permit': {
                result = await sendLeverage('leverage', [
                  marketIn,
                  ratio,
                  marketPermit.value,
                  assetPermit.value,
                ] as never);
                break;
              }
              case 'permit2': {
                result = await sendLeverage('leverage', [...args, marketPermit.value, assetPermit.value] as never);
                break;
              }
            }
            break;
          }
          case 'withdraw': {
            const args: Params<'deleverage'> = [marketIn, userInput, ratio] as const;

            if (isMultiSig) {
              result = await sendLeverage('deleverage', args);
              break;
            }

            const _slippage = (maIn.floatingBorrowAssets * ((maIn.floatingBorrowRate * 300n) / 31_536_000n)) / WAD;
            const permitShares = await publicClient.readContract({
              address: marketIn,
              abi: marketAbi,
              functionName: 'previewWithdraw',
              args: [
                (maIn.floatingBorrowAssets < limit.borrow ? 0n : maIn.floatingBorrowAssets - limit.borrow) +
                  userInput +
                  _slippage,
              ],
              account: walletAddress,
            });
            const marketPermit = await signPermit(permitShares, 'marketIn');

            if (!marketPermit || marketPermit.type === 'permit2') {
              return;
            }

            result = await sendLeverage('deleverage', [marketIn, userInput, ratio, marketPermit.value] as never);
            break;
          }
        }
      }

      if (!result?.hash) return;
      setTx({ status: result.status === 'success' ? 'success' : 'error', hash: result.hash });
      await refetch();
    } catch (e: unknown) {
      setErrorData({ status: true, message: handleOperationError(e) });
    } finally {
      setSubmitting(false);
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
    publicClient,
    isContract,
    refetch,
    userInput,
    sendLeverage,
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

    disabledSubmit,
    disabledConfirm,
    blockModal,
    isOverLeveraged,

    getHealthFactorColor,

    errorData,
    setErrorData,
    tx,
    isLoading: sendCallsPending || submitting,
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

const erc20PermitAbi = [
  {
    type: 'function',
    name: 'nonces',
    stateMutability: 'view',
    inputs: [{ name: 'owner', type: 'address' }],
    outputs: [{ name: '', type: 'uint256' }],
  },
] as const;
