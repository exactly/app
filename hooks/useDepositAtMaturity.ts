import { WAD } from '@exactly/lib';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useOperationContext } from 'contexts/OperationContext';
import {
  erc20Abi,
  marketAbi,
  marketEthRouterAbi,
  marketEthRouterAddress,
  useReadErc20Allowance,
  useReadLegacyPreviewerPreviewDepositAtMaturity,
  useReadPreviewerPreviewDepositAtMaturity,
  useSimulateErc20Approve,
  useSimulateMarketDepositAtMaturity,
  useSimulateMarketEthRouterDepositAtMaturity,
  legacyPreviewerAddress,
  previewerAddress,
} from 'generated/wagmi';
import usePreviewerExactly from 'hooks/usePreviewerExactly';
import useBalance from 'hooks/useBalance';
import { useQueryClient } from '@tanstack/react-query';
import { getContractEventsQueryKey } from '@wagmi/core/query';
import useHandleOperationError from 'hooks/useHandleOperationError';
import { useTranslation } from 'react-i18next';
import { formatUnits, parseUnits, type Hex } from 'viem';
import dayjs from 'dayjs';
import { track } from 'utils/mixpanel';
import { defaultChain } from 'utils/client';
import useReadOnly from 'hooks/useReadOnly';
import { useSendCalls, useWaitForCallsStatus } from 'wagmi';

type DepositAtMaturity = {
  deposit: () => Promise<void>;
  handleSubmitAction: () => Promise<void>;
  handleInputChange: (value: string) => void;
  updateAPR: () => void;
  isPreparing: boolean;
  isLoading: boolean;
  onMax: () => void;
  optimalDepositAmount: bigint | undefined;
  rawSlippage: string;
  setRawSlippage: (value: string) => void;
  fixedRate: bigint | undefined;
  gtMaxYield: boolean;
  txStatus?: 'loading' | 'processing' | 'success' | 'error';
  txHash?: Hex;
};

const legacyPreviewerChainId = Object.keys(legacyPreviewerAddress)
  .map(Number)
  .find((chainId): chainId is keyof typeof legacyPreviewerAddress => chainId === defaultChain.id);
const previewerChainId = Object.keys(previewerAddress)
  .map(Number)
  .find((chainId): chainId is keyof typeof previewerAddress => chainId === defaultChain.id);

export default (): DepositAtMaturity => {
  const { t } = useTranslation();
  const { account: walletAddress } = useReadOnly();

  const {
    symbol,
    errorData,
    setErrorData,
    qty,
    setQty,
    date,
    isLoading: isLoadingOp,
    setIsLoading: setIsLoadingOp,
    rawSlippage,
    setRawSlippage,
    slippage,
    setErrorButton,
  } = useOperationContext();

  const { data, refetch } = usePreviewerExactly();
  const marketAccount = data?.find((market) => market.assetSymbol === symbol);
  const queryClient = useQueryClient();
  const handleOperationError = useHandleOperationError();
  const [gtMaxYield, setGtMaxYield] = useState(false);
  const walletBalance = useBalance(symbol, marketAccount?.asset);
  const { mutateAsync: sendCalls, isPending: sendCallsPending } = useSendCalls();
  const [callId, setCallId] = useState<string>();
  const amount = useMemo(() => {
    if (!qty || !marketAccount) return;
    try {
      return parseUnits(qty, marketAccount.decimals);
    } catch {
      return;
    }
  }, [marketAccount, qty]);
  const marketEthRouterChainId = Object.keys(marketEthRouterAddress)
    .map(Number)
    .find((chainId): chainId is keyof typeof marketEthRouterAddress => chainId === defaultChain.id);
  const marketEthRouter =
    marketEthRouterChainId === undefined ? undefined : marketEthRouterAddress[marketEthRouterChainId];
  const legacyDepositPreview = useReadLegacyPreviewerPreviewDepositAtMaturity({
    chainId: legacyPreviewerChainId,
    args: marketAccount && date && amount !== undefined ? [marketAccount.market, date, amount] : undefined,
    query: {
      enabled: Boolean(
        legacyPreviewerChainId !== undefined && marketAccount && date && amount !== undefined && amount > 0n,
      ),
    },
  });
  const depositPreview = useReadPreviewerPreviewDepositAtMaturity({
    chainId: previewerChainId,
    args: marketAccount && date && amount !== undefined ? [marketAccount.market, date, amount] : undefined,
    query: {
      enabled: Boolean(
        legacyPreviewerChainId === undefined &&
          previewerChainId !== undefined &&
          marketAccount &&
          date &&
          amount !== undefined &&
          amount > 0n,
      ),
    },
  });
  const finalAssets =
    legacyPreviewerChainId !== undefined ? legacyDepositPreview.data?.assets : depositPreview.data?.assets;
  const fixedFee = amount !== undefined && finalAssets !== undefined ? finalAssets - amount : undefined;
  const { optimalDepositAmount, depositRate } = useMemo<{
    optimalDepositAmount?: bigint;
    depositRate?: bigint;
  }>(() => {
    if (!marketAccount) return { optimalDepositAmount: 0n, depositRate: 0n };

    const pool = marketAccount.fixedPools.find(({ maturity }) => maturity === date);
    return {
      optimalDepositAmount: pool?.optimalDeposit,
      depositRate: pool?.depositRate,
    };
  }, [marketAccount, date]);
  const fixedRate = useMemo(() => {
    if (!date || !depositRate) return;
    if (!amount || !finalAssets) return depositRate;
    const currentTimestamp = BigInt(dayjs().unix());
    return (((finalAssets * WAD) / amount - WAD) * 31_536_000n) / (date - currentTimestamp);
  }, [amount, date, depositRate, finalAssets]);
  const minAmount = amount !== undefined && fixedFee !== undefined ? ((amount + fixedFee) * slippage) / WAD : undefined;
  const { data: allowance, refetch: refetchAllowance } = useReadErc20Allowance({
    address: marketAccount?.asset,
    args: walletAddress && marketAccount ? [walletAddress, marketAccount.market] : undefined,
    chainId: defaultChain.id,
    query: { enabled: Boolean(walletAddress && marketAccount && marketAccount.assetSymbol !== 'WETH') },
  });
  const inputReady = Boolean(
    walletAddress &&
      marketAccount &&
      date &&
      amount !== undefined &&
      minAmount !== undefined &&
      parseFloat(qty) > 0 &&
      (!walletBalance || parseFloat(qty) <= parseFloat(walletBalance)),
  );
  const requiresBatchedApproval = Boolean(
    inputReady && marketAccount?.assetSymbol !== 'WETH' && allowance !== undefined && allowance < (amount ?? 0n),
  );
  const approveSimulation = useSimulateErc20Approve({
    address: marketAccount?.asset,
    args: marketAccount && amount !== undefined ? [marketAccount.market, amount] : undefined,
    account: walletAddress,
    chainId: defaultChain.id,
    query: { enabled: requiresBatchedApproval },
  });
  const depositSimulation = useSimulateMarketDepositAtMaturity({
    address: marketAccount?.market,
    args:
      date && amount !== undefined && minAmount !== undefined && walletAddress
        ? [date, amount, minAmount, walletAddress]
        : undefined,
    account: walletAddress,
    chainId: defaultChain.id,
    query: {
      enabled: Boolean(
        inputReady && marketAccount?.assetSymbol !== 'WETH' && allowance !== undefined && !requiresBatchedApproval,
      ),
    },
  });
  const ethDepositSimulation = useSimulateMarketEthRouterDepositAtMaturity({
    args: date && minAmount !== undefined ? [date, minAmount] : undefined,
    account: walletAddress,
    chainId: marketEthRouterChainId,
    value: amount,
    query: {
      enabled: Boolean(inputReady && marketAccount?.assetSymbol === 'WETH' && marketEthRouterChainId !== undefined),
    },
  });
  const callsStatus = useWaitForCallsStatus({
    id: callId,
    query: { enabled: Boolean(callId) },
  });
  const needsBatchedApproval = useCallback(async () => {
    if (marketAccount?.assetSymbol === 'WETH' || !walletAddress || amount === undefined || !marketAccount) return false;
    return (allowance ?? (await refetchAllowance()).data ?? 0n) < amount;
  }, [allowance, amount, marketAccount, refetchAllowance, walletAddress]);
  const isLoading = useMemo(() => sendCallsPending || isLoadingOp, [sendCallsPending, isLoadingOp]);
  const isPreparing = useMemo(
    () =>
      approveSimulation.isLoading ||
      depositSimulation.isLoading ||
      ethDepositSimulation.isLoading ||
      legacyDepositPreview.isLoading ||
      depositPreview.isLoading,
    [
      approveSimulation.isLoading,
      depositPreview.isLoading,
      depositSimulation.isLoading,
      ethDepositSimulation.isLoading,
      legacyDepositPreview.isLoading,
    ],
  );
  const txHash = callsStatus.data?.receipts?.[0]?.transactionHash;
  const txStatus = useMemo(() => {
    if (!callId) return;
    if (callsStatus.data?.status === 'success') return 'success';
    if (callsStatus.data?.status === 'failure' || callsStatus.isError) return 'error';
    return 'processing';
  }, [callId, callsStatus.data?.status, callsStatus.isError]);
  const simulationError = useMemo(() => {
    if (!inputReady || !marketAccount) return;
    if (marketAccount.assetSymbol === 'WETH') return ethDepositSimulation.error;
    if (requiresBatchedApproval) return approveSimulation.error;
    return depositSimulation.error;
  }, [
    approveSimulation.error,
    depositSimulation.error,
    ethDepositSimulation.error,
    inputReady,
    marketAccount,
    requiresBatchedApproval,
  ]);

  useEffect(() => {
    if (!simulationError) {
      if (errorData?.component === 'simulation') setErrorData(undefined);
      return;
    }
    setErrorData({ status: true, message: handleOperationError(simulationError), component: 'simulation' });
  }, [errorData?.component, handleOperationError, setErrorData, simulationError]);

  useEffect(() => {
    if (!callsStatus.data?.receipts?.length) return;
    void refetch();
    if (walletAddress) {
      void queryClient.invalidateQueries({
        queryKey: getContractEventsQueryKey({
          abi: marketAbi,
          eventName: 'DepositAtMaturity',
          args: { owner: walletAddress },
          chainId: defaultChain.id,
        }),
      });
    }
    if (marketAccount?.assetSymbol !== 'WETH') void refetchAllowance();
  }, [callsStatus.data?.receipts, marketAccount?.assetSymbol, refetchAllowance, refetch, queryClient, walletAddress]);

  useEffect(() => {
    if (!callsStatus.data || !marketAccount || !txHash) return;
    if (callsStatus.data.status !== 'success' && callsStatus.data.status !== 'failure') return;
    track('TX Completed', {
      contractName: marketAccount.assetSymbol === 'WETH' ? 'ETHRouter' : 'Market',
      method: 'depositAtMaturity',
      symbol,
      amount: qty,
      usdAmount: formatUnits(
        (parseUnits(qty, marketAccount.decimals) * marketAccount.usdPrice) / WAD,
        marketAccount.decimals,
      ),
      status: callsStatus.data.status === 'success' ? 'success' : 'reverted',
      hash: txHash,
    });
  }, [callsStatus.data, marketAccount, qty, symbol, txHash]);

  const onMax = useCallback(() => {
    if (walletBalance) {
      setQty(walletBalance);
      setErrorData(undefined);
    }
  }, [setErrorData, setQty, walletBalance]);

  const handleInputChange = useCallback(
    (value: string) => {
      if (!marketAccount) return;

      setQty(value);

      if (walletBalance && parseFloat(value) > parseFloat(walletBalance)) {
        setErrorButton(t('Insufficient balance'));
        return;
      }
      setErrorButton(undefined);
      setErrorData(undefined);
      setGtMaxYield(!!optimalDepositAmount && parseUnits(value || '0', marketAccount.decimals) > optimalDepositAmount);
    },
    [marketAccount, optimalDepositAmount, setErrorButton, setErrorData, setQty, t, walletBalance],
  );

  const deposit = useCallback(async () => {
    if (!walletAddress || !marketAccount || !date || amount === undefined || minAmount === undefined) return;
    setIsLoadingOp(true);
    setCallId(undefined);
    try {
      let id: string;
      if (marketAccount.assetSymbol === 'WETH') {
        if (!marketEthRouter) return;
        if (ethDepositSimulation.error) throw ethDepositSimulation.error;
        ({ id } = await sendCalls({
          chainId: defaultChain.id,
          experimental_fallback: true,
          calls: [
            {
              to: marketEthRouter,
              abi: marketEthRouterAbi,
              functionName: 'depositAtMaturity',
              args: [date, minAmount],
              value: amount,
            },
          ],
        }));
      } else {
        if (requiresBatchedApproval && approveSimulation.error) throw approveSimulation.error;
        if (!requiresBatchedApproval && depositSimulation.error) throw depositSimulation.error;
        ({ id } = await sendCalls({
          chainId: defaultChain.id,
          experimental_fallback: true,
          calls: [
            ...((await needsBatchedApproval())
              ? [
                  {
                    to: marketAccount.asset,
                    abi: erc20Abi,
                    functionName: 'approve',
                    args: [marketAccount.market, amount],
                  } as const,
                ]
              : []),
            {
              to: marketAccount.market,
              abi: marketAbi,
              functionName: 'depositAtMaturity',
              args: [date, amount, minAmount, walletAddress],
            },
          ],
        }));
      }
      setCallId(id);
      track('TX Signed', {
        contractName: marketAccount.assetSymbol === 'WETH' ? 'ETHRouter' : 'Market',
        method: 'depositAtMaturity',
        callId: id,
        symbol,
        amount: qty,
        usdAmount: formatUnits((amount * marketAccount.usdPrice) / WAD, marketAccount.decimals),
      });
    } catch (error) {
      setErrorData({ status: true, message: handleOperationError(error) });
    } finally {
      setIsLoadingOp(false);
    }
  }, [
    amount,
    approveSimulation.error,
    date,
    depositSimulation.error,
    ethDepositSimulation.error,
    handleOperationError,
    marketAccount,
    marketEthRouter,
    minAmount,
    needsBatchedApproval,
    qty,
    requiresBatchedApproval,
    sendCalls,
    setErrorData,
    setIsLoadingOp,
    symbol,
    walletAddress,
  ]);

  const handleSubmitAction = useCallback(async () => {
    if (isLoading) return;
    return deposit();
  }, [deposit, isLoading]);

  const updateAPR = useCallback(() => {
    if (legacyPreviewerChainId !== undefined) void legacyDepositPreview.refetch();
    else void depositPreview.refetch();
  }, [depositPreview, legacyDepositPreview]);

  return {
    isLoading,
    isPreparing,
    onMax,
    handleInputChange,
    handleSubmitAction,
    deposit,
    updateAPR,
    optimalDepositAmount,
    rawSlippage,
    setRawSlippage,
    fixedRate,
    gtMaxYield,
    txStatus,
    txHash,
  };
};
