import { WAD } from '@exactly/lib';

import { useOperationContext } from 'contexts/OperationContext';
import {
  erc20Abi,
  marketAbi,
  marketEthRouterAbi,
  marketEthRouterAddress,
  useReadErc20Allowance,
  useSimulateErc20Approve,
  useSimulateMarketDeposit,
  useSimulateMarketEthRouterDeposit,
} from 'generated/wagmi';
import usePreviewerExactly from 'hooks/usePreviewerExactly';
import useBalance from 'hooks/useBalance';
import useHandleOperationError from 'hooks/useHandleOperationError';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useSendCalls, useWaitForCallsStatus } from 'wagmi';
import { formatUnits, parseUnits, type Hex } from 'viem';
import { track } from 'utils/mixpanel';
import useReadOnly from 'hooks/useReadOnly';
import { defaultChain } from 'utils/client';

type Deposit = {
  deposit: () => Promise<void>;
  handleSubmitAction: () => Promise<void>;
  handleInputChange: (value: string) => void;
  isPreparing: boolean;
  isLoading: boolean;
  onMax: () => void;
  txStatus?: 'loading' | 'processing' | 'success' | 'error';
  txHash?: Hex;
};

export default (): Deposit => {
  const { t } = useTranslation();
  const { account: walletAddress } = useReadOnly();

  const {
    symbol,
    errorData,
    setErrorData,
    qty,
    setQty,
    isLoading: isLoadingOp,
    setIsLoading: setIsLoadingOp,
    setErrorButton,
  } = useOperationContext();

  const handleOperationError = useHandleOperationError();
  const { data, refetch } = usePreviewerExactly();
  const marketAccount = data?.find((market) => market.assetSymbol === symbol);
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
  const { data: allowance, refetch: refetchAllowance } = useReadErc20Allowance({
    address: marketAccount?.asset,
    args: walletAddress && marketAccount ? [walletAddress, marketAccount.market] : undefined,
    chainId: defaultChain.id,
    query: { enabled: Boolean(walletAddress && marketAccount && marketAccount.assetSymbol !== 'WETH') },
  });
  const inputReady = Boolean(
    walletAddress &&
      marketAccount &&
      amount !== undefined &&
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
  const depositSimulation = useSimulateMarketDeposit({
    address: marketAccount?.market,
    args: amount !== undefined && walletAddress ? [amount, walletAddress] : undefined,
    account: walletAddress,
    chainId: defaultChain.id,
    query: {
      enabled: Boolean(
        inputReady && marketAccount?.assetSymbol !== 'WETH' && allowance !== undefined && !requiresBatchedApproval,
      ),
    },
  });
  const ethDepositSimulation = useSimulateMarketEthRouterDeposit({
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

  const needsBatchedApproval = useCallback(
    async (quantity: string): Promise<boolean> => {
      try {
        if (!quantity || marketAccount?.assetSymbol === 'WETH') return false;
        if (!walletAddress || !marketAccount) return true;
        return (allowance ?? (await refetchAllowance()).data ?? 0n) < parseUnits(quantity, marketAccount.decimals);
      } catch {
        return true;
      }
    },
    [allowance, marketAccount, refetchAllowance, walletAddress],
  );

  const isLoading = useMemo(() => sendCallsPending || isLoadingOp, [sendCallsPending, isLoadingOp]);
  const isPreparing = useMemo(
    () => approveSimulation.isLoading || depositSimulation.isLoading || ethDepositSimulation.isLoading,
    [approveSimulation.isLoading, depositSimulation.isLoading, ethDepositSimulation.isLoading],
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
    if (marketAccount?.assetSymbol !== 'WETH') void refetchAllowance();
  }, [callsStatus.data?.receipts, marketAccount?.assetSymbol, refetchAllowance, refetch]);

  useEffect(() => {
    if (!callsStatus.data || !marketAccount || !txHash) return;
    if (callsStatus.data.status !== 'success' && callsStatus.data.status !== 'failure') return;
    track('TX Completed', {
      contractName: 'Market',
      method: 'deposit',
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
  }, [walletBalance, setQty, setErrorData]);

  const handleInputChange = useCallback(
    (value: string) => {
      setQty(value);

      if (walletBalance && parseFloat(value) > parseFloat(walletBalance)) {
        setErrorButton(t('Insufficient balance'));
        return;
      }
      setErrorButton(undefined);
      setErrorData(undefined);
    },
    [setQty, walletBalance, setErrorData, setErrorButton, t],
  );

  const deposit = useCallback(async () => {
    if (!walletAddress || !marketAccount || amount === undefined) return;
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
              functionName: 'deposit',
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
            ...((await needsBatchedApproval(qty))
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
              functionName: 'deposit',
              args: [amount, walletAddress],
            },
          ],
        }));
      }
      setCallId(id);
      track('TX Signed', {
        contractName: marketAccount.assetSymbol === 'WETH' ? 'ETHRouter' : 'Market',
        method: 'deposit',
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
    walletAddress,
    marketAccount,
    amount,
    marketEthRouter,
    ethDepositSimulation.error,
    requiresBatchedApproval,
    approveSimulation.error,
    depositSimulation.error,
    setIsLoadingOp,
    sendCalls,
    needsBatchedApproval,
    qty,
    symbol,
    setErrorData,
    handleOperationError,
  ]);

  const handleSubmitAction = useCallback(async () => {
    if (isLoading) return;
    return deposit();
  }, [isLoading, deposit]);

  return {
    isLoading,
    isPreparing,
    onMax,
    handleInputChange,
    handleSubmitAction,
    deposit,
    txStatus,
    txHash,
  };
};
