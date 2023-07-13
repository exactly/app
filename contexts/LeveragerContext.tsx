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
import LeveragerModal from 'components/Leverager/Modal';
import useDebtManager from 'hooks/useDebtManager';
import useAccountData, { type MarketAccount } from 'hooks/useAccountData';
import useMarket from 'hooks/useMarket';
import { useWeb3 } from 'hooks/useWeb3';
import type { DebtManager, Market } from 'types/contracts';
import { GAS_LIMIT_MULTIPLIER, MAX_UINT256, WEI_PER_ETHER } from 'utils/const';
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
import { isPermitAllowed } from 'utils/permit';
import useDebtPreviewer, { Limit, Leverage as LeverageStatus } from 'hooks/useDebtPreviewer';
import useDelayedEffect from 'hooks/useDelayedEffect';
import useRewards from 'hooks/useRewards';
import useFloatingPoolAPR from 'hooks/useFloatingPoolAPR';
import { debtManagerABI } from 'types/abi';

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

export type ApprovalStatus = 'INIT' | 'ERC20' | 'ERC20-PERMIT2' | 'MARKET' | 'APPROVED';

const DEFAULT_SLIPPAGE = 2n;

const slippage = (value: bigint, up = true) => (value * (100n + (up ? 1n : -1n) * DEFAULT_SLIPPAGE)) / 100n;

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

// TODO(jg): Define logic for minimum healthfactor
const minHealthFactor = (maIn: MarketAccount, maOut: MarketAccount): bigint => {
  if (maIn.asset === maOut.asset) {
    return parseEther('1.02');
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
  const { signTypedDataAsync } = useSignTypedData();
  const publicClient = usePublicClient();
  const [isOpen, setIsOpen] = useState(false);
  const [viewSummary, setViewSummary] = useState(false);
  const [errorData, setErrorData] = useState<ErrorData | undefined>();

  const [input, dispatch] = useReducer(reducer, initState);

  const [tx, setTx] = useState<Transaction | undefined>();
  const [isLoading, setIsLoading] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);

  const options = useAssets();
  const { rates } = useRewards();

  const maIn = useMemo(
    () => getMarketAccount(input.collateralSymbol ?? 'USDC'),
    [getMarketAccount, input.collateralSymbol],
  );

  const maOut = useMemo(() => getMarketAccount(input.borrowSymbol ?? 'USDC'), [getMarketAccount, input.borrowSymbol]);

  const marketIn = useMarket(maIn?.market);
  const marketOut = useMarket(maOut?.market);
  const assetIn = useERC20(maIn?.asset);
  const assetOut = useERC20(maOut?.asset);

  const debtManager = useDebtManager();
  const debtPreviewer = useDebtPreviewer();
  const permit2 = usePermit2();

  const minLeverageRatio = 1;

  const [leverageStatus, setLeverageStatus] = useState<LeverageStatus>();

  const defaultLeverage = useCallback(
    async (cancelled: () => boolean, borrowSymbol: string | undefined = input.borrowSymbol) => {
      if (!debtPreviewer || !walletAddress || !input.collateralSymbol || !borrowSymbol || !opts || !maIn) {
        setLeverageStatus(undefined);
        return undefined;
      }

      const _maOut = getMarketAccount(borrowSymbol);
      if (!_maOut) return undefined;

      const { result } = await debtPreviewer.simulate.leverage(
        [maIn.market, _maOut.market, walletAddress, minHealthFactor(maIn, _maOut)],
        opts,
      );

      if (cancelled()) return undefined;

      setLeverageStatus(result);
      return result;
    },
    [debtPreviewer, getMarketAccount, input.borrowSymbol, input.collateralSymbol, maIn, opts, walletAddress],
  );

  const walletBalance = useBalance(input.collateralSymbol, maIn?.asset);

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

  const [limit, setLimit] = useState<Limit>();

  const maxRatio = useMemo(() => {
    return limit?.maxRatio ?? leverageStatus?.maxRatio ?? 1n;
  }, [leverageStatus?.maxRatio, limit]);

  const userInput = useMemo(() => {
    if (!maIn) return 0n;
    return parseUnits(input.userInput, maIn.decimals);
  }, [maIn, input.userInput]);

  const preview = useCallback(
    async (cancelled: () => boolean) => {
      if (!debtPreviewer || !maIn || !maOut || !walletAddress || !opts) {
        return;
      }

      const ratio = parseEther(String(input.leverageRatio));
      const args = [
        maIn.market,
        maOut.market,
        walletAddress,
        userInput,
        ratio < maxRatio ? ratio : maxRatio,
        minHealthFactor(maIn, maOut),
      ] as const;

      try {
        const { result } =
          input.secondaryOperation === 'deposit'
            ? await debtPreviewer.simulate.previewLeverage(args, opts)
            : await debtPreviewer.simulate.previewDeleverage(args, opts);

        if (cancelled()) return;

        setLimit(result);
      } catch {
        if (cancelled()) return;
        setLimit(undefined);
      }
    },
    [
      debtPreviewer,
      input.leverageRatio,
      input.secondaryOperation,
      maIn,
      maOut,
      maxRatio,
      opts,
      userInput,
      walletAddress,
    ],
  );

  const { isLoading: previewIsLoading } = useDelayedEffect({ effect: preview });

  const { depositAPR } = useFloatingPoolAPR(input.collateralSymbol || 'USDC', undefined, 'deposit');
  const { borrowAPR } = useFloatingPoolAPR(input.borrowSymbol || 'USDC', undefined, 'borrow');

  const newHealthFactor = useMemo(() => {
    if (!healthFactor || !leverageStatus || !maIn || !maOut || !limit || previewIsLoading) {
      return undefined;
    }

    const depositsUSD = ((limit.deposit - leverageStatus.deposit) * maIn.usdPrice) / 10n ** BigInt(maIn.decimals);

    const borrowsUSD = ((limit.borrow - leverageStatus.borrow) * maOut.usdPrice) / 10n ** BigInt(maOut.decimals);

    const collateral = (depositsUSD * maIn.adjustFactor) / WEI_PER_ETHER;
    const debt = (borrowsUSD * WEI_PER_ETHER) / maOut.adjustFactor;

    return parseHealthFactor(healthFactor.debt + debt, healthFactor.collateral + collateral);
  }, [healthFactor, leverageStatus, limit, maIn, maOut, previewIsLoading]);

  const setCollateralSymbol = useCallback((collateralSymbol: string) => {
    setErrorData(undefined);
    dispatch({ ...initState, collateralSymbol });
  }, []);

  const setBorrowSymbol = useCallback(
    async (borrowSymbol: string) => {
      if (!input.collateralSymbol) return;
      setErrorData(undefined);
      const res = await defaultLeverage(() => false, borrowSymbol);
      dispatch({
        ...initState,
        collateralSymbol: input.collateralSymbol,
        borrowSymbol: borrowSymbol,
        leverageRatio: res ? Number(res.ratio) / 1e18 : minLeverageRatio,
      });
    },
    [input.collateralSymbol, defaultLeverage],
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
    () => (leverageStatus ? Number(leverageStatus.ratio) / 1e18 : minLeverageRatio),
    [leverageStatus],
  );

  const close = useCallback(() => setIsOpen(false), []);

  const _setViewSummary = useCallback((_state: boolean) => {
    setAcceptedTerms(false);
    setViewSummary(_state);
  }, []);

  const setLeverageRatio = useCallback(
    (leverageRatio: number) => {
      const _secondaryOperation = leverageRatio < currentLeverageRatio ? 'withdraw' : 'deposit';
      const changedOperation = _secondaryOperation !== input.secondaryOperation;
      setErrorData(undefined);

      dispatch({
        leverageRatio,
        secondaryOperation: _secondaryOperation,
        userInput: changedOperation ? '' : input.userInput,
      });
    },
    [input.secondaryOperation, input.userInput, currentLeverageRatio],
  );

  const openLeverager = useCallback(
    (collateralSymbol?: string) => {
      dispatch({ ...initState, collateralSymbol });
      _setViewSummary(false);
      setErrorData(undefined);
      setTx(undefined);
      setIsLoading(false);
      setIsOpen(true);
      dispatch(initState);
    },
    [_setViewSummary],
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
        if (walletBalance && parseFloat(value) > parseFloat(walletBalance)) {
          return setErrorData({ status: true, message: t('Insufficient balance') });
        }
      } else {
        if (principal !== undefined && parsed > principal) {
          return setErrorData({ status: true, message: t('Insufficient funds') });
        }
      }

      dispatch({
        leverageRatio: Math.min(
          limit
            ? Number(limit.maxRatio) / 1e18
            : leverageStatus
            ? Number(leverageStatus.maxRatio) / 1e18
            : input.leverageRatio,
          input.leverageRatio,
        ),
      });
      setErrorData(undefined);
    },
    [
      setUserInput,
      maIn?.decimals,
      input.secondaryOperation,
      input.leverageRatio,
      limit,
      leverageStatus,
      walletBalance,
      t,
      principal,
    ],
  );

  const [loopAPR, marketAPR, rewardsAPR, nativeAPR] = useMemo(() => {
    if (!input.collateralSymbol || !input.borrowSymbol) return [0, 0, 0, 0];

    const ratio = input.leverageRatio;

    const _marketAPR = depositAPR && borrowAPR ? depositAPR * ratio - borrowAPR * (ratio - 1) : 0;

    const collateralRewardsAPR =
      rates[input.collateralSymbol]
        ?.map((r) => (Number(r.floatingDeposit) / 1e18) * ratio)
        .reduce((acc, curr) => acc + curr, 0) ?? 0;

    const borrowRewardsAPR =
      rates[input.borrowSymbol]
        ?.map((r) => (Number(r.borrow) / 1e18) * (ratio - 1))
        .reduce((acc, curr) => acc + curr, 0) ?? 0;

    const _rewardsAPR = collateralRewardsAPR + borrowRewardsAPR;

    const _nativeAPR = 0;

    const _loopAPR = _marketAPR + _rewardsAPR + _nativeAPR;

    return [_loopAPR, _marketAPR, _rewardsAPR, _nativeAPR];
  }, [borrowAPR, depositAPR, input.borrowSymbol, input.collateralSymbol, input.leverageRatio, rates]);

  const marketRewards = useMemo(() => {
    if (!input.collateralSymbol || !input.borrowSymbol) return [];

    const collateralRewards = rates[input.collateralSymbol]?.map((r) => r.assetSymbol) ?? [];
    const borrowRewards = rates[input.borrowSymbol]?.map((r) => r.assetSymbol) ?? [];
    return [...new Set([...collateralRewards, ...borrowRewards])];
  }, [input.borrowSymbol, input.collateralSymbol, rates]);

  const nativeRewards = useMemo(() => [], []);

  const disabledSubmit = useMemo(
    () =>
      !input.collateralSymbol ||
      !input.borrowSymbol ||
      errorData?.status ||
      (currentLeverageRatio === input.leverageRatio && !input.userInput) ||
      (principal ?? -1n) < 0n,
    [
      input.collateralSymbol,
      input.borrowSymbol,
      input.leverageRatio,
      input.userInput,
      errorData?.status,
      currentLeverageRatio,
      principal,
    ],
  );

  const disabledConfirm = useMemo(() => disabledSubmit || !acceptedTerms, [acceptedTerms, disabledSubmit]);

  // TODO(jg): Change thresholds!
  const getHealthFactorColor = useCallback(
    (_healthFactor?: string) => {
      if (!_healthFactor) return { color: palette.healthFactor.safe, bg: palette.healthFactor.bg.safe };
      const parsedHF = parseFloat(_healthFactor);
      const status = parsedHF < 1.01 ? 'danger' : parsedHF < 1.05 ? 'warning' : 'safe';
      return { color: palette.healthFactor[status], bg: palette.healthFactor.bg[status] };
    },
    [palette.healthFactor],
  );

  const [approvalStatus, setApprovalStatus] = useState<ApprovalStatus>('INIT');
  const needsApproval = useCallback(async (): Promise<boolean> => {
    if (
      !maIn ||
      !input.collateralSymbol ||
      !input.borrowSymbol ||
      !walletAddress ||
      !marketOut ||
      !assetIn ||
      !permit2 ||
      !debtManager ||
      !limit ||
      !opts
    ) {
      return true;
    }

    const borrowAssets = limit.borrow;
    const _deposit = parseUnits(input.userInput, maIn.decimals);
    setIsLoading(true);
    setApprovalStatus('INIT');
    try {
      if (await isContract(walletAddress)) {
        if (input.secondaryOperation === 'deposit') {
          setApprovalStatus('ERC20');
          const assetAllowance = await assetIn.read.allowance([walletAddress, debtManager.address], opts);
          if (assetAllowance <= _deposit) return true;
        }

        setApprovalStatus('MARKET');
        const marketOutAllownce = await marketOut.read.allowance([walletAddress, debtManager.address], opts);
        if (marketOutAllownce <= borrowAssets) return true;

        setApprovalStatus('APPROVED');
        return false;
      }

      if (!isPermitAllowed(chain, maIn.assetSymbol) && input.secondaryOperation === 'deposit') {
        setApprovalStatus('ERC20-PERMIT2');
        const allowance = await assetIn.read.allowance([walletAddress, permit2.address], opts);
        if (allowance <= _deposit) return true;
      }

      setApprovalStatus('APPROVED');
      return false;
    } catch (e: unknown) {
      setErrorData({ status: true, message: handleOperationError(e) });
      return true;
    } finally {
      setIsLoading(false);
    }
  }, [
    maIn,
    input.collateralSymbol,
    input.borrowSymbol,
    input.userInput,
    input.secondaryOperation,
    walletAddress,
    marketOut,
    assetIn,
    permit2,
    debtManager,
    limit,
    opts,
    isContract,
    chain,
  ]);

  const approve = useCallback(async () => {
    if (!debtManager || !marketOut || !assetIn || !permit2 || !opts) return;

    // TODO: Define max assets to approve (Uint256)
    // Deposit for both ERC20, and newBorrow.value (for leverage) and floatingBorrowAssets - newBorrow (-withdraw?) for deleverage
    const max = MAX_UINT256;
    setIsLoading(true);
    try {
      const args = [debtManager.address, max] as const;
      let hash: Hex | undefined;
      switch (approvalStatus) {
        case 'ERC20': {
          const gasEstimation = await assetIn.estimateGas.approve(args, opts);
          hash = await assetIn.write.approve(args, {
            ...opts,
            gasLimit: (gasEstimation * GAS_LIMIT_MULTIPLIER) / WEI_PER_ETHER,
          });
          break;
        }
        case 'ERC20-PERMIT2': {
          const approvePermit2 = [permit2.address, max] as const;
          const gasEstimation = await assetIn.estimateGas.approve(approvePermit2, opts);
          hash = await assetIn.write.approve(approvePermit2, {
            ...opts,
            gasLimit: (gasEstimation * GAS_LIMIT_MULTIPLIER) / WEI_PER_ETHER,
          });
          break;
        }
        case 'MARKET': {
          const gasEstimation = await marketOut.estimateGas.approve(args, opts);
          hash = await marketOut.write.approve(args, {
            ...opts,
            gasLimit: (gasEstimation * GAS_LIMIT_MULTIPLIER) / WEI_PER_ETHER,
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
  }, [approvalStatus, assetIn, debtManager, marketOut, opts, permit2]);

  const signPermit = useCallback(
    async (value: bigint, who: 'assetIn' | 'marketIn' | 'marketOut') => {
      if (!walletAddress || !maIn || !marketIn || !marketOut || !assetIn || !permit2 || !debtManager) return;

      const deadline = BigInt(dayjs().unix() + 3_600);

      if (who === 'assetIn' && !isPermitAllowed(chain, maIn.assetSymbol)) {
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
          name: who.startsWith('market') ? '' : maIn.assetSymbol,
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
        deadline,
        ...{ v, r: r as Hex, s: s as Hex },
      } as const;

      return { type: 'permit', value: permit } as const;
    },
    [
      assetIn,
      chain,
      debtManager,
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
                gasLimit: (gasEstimation * GAS_LIMIT_MULTIPLIER) / WEI_PER_ETHER,
              });
              break;
            }

            const borrowAssets = limit.borrow;
            const [assetPermit, marketPermit] = await Promise.all([
              signPermit(userInput, 'assetIn'),
              signPermit(borrowAssets, 'marketIn'),
            ]);
            if (!assetPermit || !marketPermit || assetPermit.type === 'permit' || marketPermit.type === 'permit2') {
              return;
            }

            args = [...args, borrowAssets, marketPermit.value, assetPermit.value];
            const gasEstimation = await debtManager.estimateGas.leverage(args, opts);
            hash = await debtManager.write.leverage(args, {
              ...opts,
              gasLimit: (gasEstimation * GAS_LIMIT_MULTIPLIER) / WEI_PER_ETHER,
            });
            break;
          }
          case 'withdraw': {
            let args: Params<'deleverage'> = [marketIn.address, userInput, ratio] as const;

            if (isMultiSig) {
              const gasEstimation = await debtManager.estimateGas.deleverage(args, opts);
              hash = await debtManager.write.deleverage(args, {
                ...opts,
                gasLimit: (gasEstimation * GAS_LIMIT_MULTIPLIER) / WEI_PER_ETHER,
              });
              break;
            }

            const permitAssets =
              (maIn.floatingBorrowAssets < limit.borrow ? 0n : maIn.floatingBorrowAssets - limit.borrow) + userInput;
            const marketPermit = await signPermit(permitAssets, 'marketIn');

            if (!marketPermit || marketPermit.type === 'permit2') {
              return;
            }

            args = [...args, permitAssets, marketPermit.value] as const;
            const gasEstimation = await debtManager.estimateGas.deleverage(args, opts);
            hash = await debtManager.write.deleverage(args, {
              ...opts,
              gasLimit: (gasEstimation * GAS_LIMIT_MULTIPLIER) / WEI_PER_ETHER,
            });
            break;
          }
        }
      } else {
        switch (input.secondaryOperation) {
          case 'deposit': {
            const priceLimit =
              assetOut.address === leverageStatus.pool.token0
                ? slippage(leverageStatus.sqrtPriceX96, false)
                : slippage(leverageStatus.sqrtPriceX96);
            let args: Params<'crossLeverage'> = [
              marketIn.address,
              marketOut.address,
              leverageStatus.pool.fee,
              userInput,
              ratio,
              priceLimit,
            ] as const;

            if (isMultiSig) {
              const gasEstimation = await debtManager.estimateGas.crossLeverage(args, opts);
              hash = await debtManager.write.crossLeverage(args, {
                ...opts,
                gasLimit: (gasEstimation * GAS_LIMIT_MULTIPLIER) / WEI_PER_ETHER,
              });
              break;
            }

            const borrowAssets = limit.borrow;
            const [assetPermit, marketPermit] = await Promise.all([
              signPermit(userInput, 'assetIn'),
              signPermit(borrowAssets, 'marketOut'),
            ]);
            if (
              !assetPermit ||
              !marketPermit ||
              !leverageStatus ||
              marketPermit.type === 'permit2' ||
              assetPermit.type === 'permit'
            ) {
              return;
            }

            args = [...args, borrowAssets, marketPermit.value, assetPermit.value] as const;

            const gasEstimation = await debtManager.estimateGas.crossLeverage(args, opts);
            hash = await debtManager.write.crossLeverage(args, {
              ...opts,
              gasLimit: (gasEstimation * GAS_LIMIT_MULTIPLIER) / WEI_PER_ETHER,
            });
            break;
          }
          case 'withdraw': {
            const priceLimit =
              assetIn.address === leverageStatus.pool.token0
                ? slippage(leverageStatus.sqrtPriceX96, false)
                : slippage(leverageStatus.sqrtPriceX96);
            let args: Params<'crossDeleverage'> = [
              marketIn.address,
              marketOut.address,
              leverageStatus.pool.fee,
              userInput,
              ratio,
              priceLimit,
            ] as const;

            if (isMultiSig) {
              const gasEstimation = await debtManager.estimateGas.crossDeleverage(args, opts);
              hash = await debtManager.write.crossDeleverage(args, {
                ...opts,
                gasLimit: (gasEstimation * GAS_LIMIT_MULTIPLIER) / WEI_PER_ETHER,
              });
              break;
            }

            const permitAssets = slippage(
              (maIn.floatingDepositAssets < limit.deposit ? 0n : maIn.floatingDepositAssets - limit.deposit) +
                userInput,
            );

            const marketPermit = await signPermit(permitAssets, 'marketIn');
            if (!marketPermit || !leverageStatus || marketPermit.type === 'permit2') {
              return;
            }

            args = [...args, permitAssets, marketPermit.value] as const;
            const gasEstimation = await debtManager.estimateGas.crossDeleverage(args, opts);
            hash = await debtManager.write.crossDeleverage(args, {
              ...opts,
              gasLimit: (gasEstimation * GAS_LIMIT_MULTIPLIER) / WEI_PER_ETHER,
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
