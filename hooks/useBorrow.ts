import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { WAD } from '@exactly/lib';

import { useOperationContext } from 'contexts/OperationContext';
import {
  marketAbi,
  marketEthRouterAbi,
  marketEthRouterAddress,
  useReadMarketAllowance,
  useSimulateMarketApprove,
  useSimulateMarketBorrow,
  useSimulateMarketEthRouterBorrow,
} from 'generated/wagmi';
import usePreviewerExactly from 'hooks/usePreviewerExactly';
import useHandleOperationError from 'hooks/useHandleOperationError';
import getBeforeBorrowLimit from 'utils/getBeforeBorrowLimit';
import useHealthFactor from './useHealthFactor';
import { parseUnits, formatUnits, type Hex } from 'viem';
import { track } from 'utils/mixpanel';
import useReadOnly from 'hooks/useReadOnly';
import { defaultChain } from 'utils/client';
import { useSendCalls, useWaitForCallsStatus } from 'wagmi';

type Borrow = {
  handleInputChange: (value: string) => void;
  handleBasicInputChange: (value: string) => void;
  handleSubmitAction: () => Promise<void>;
  borrow: () => Promise<void>;
  isPreparing: boolean;
  isLoading: boolean;
  onMax: () => void;
  safeMaximumBorrow: string;
  txStatus?: 'loading' | 'processing' | 'success' | 'error';
  txHash?: Hex;
};

export default (): Borrow => {
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
  } = useOperationContext();

  const { data: accountData, refetch } = usePreviewerExactly();
  const marketAccount = accountData?.find((market) => market.assetSymbol === symbol);
  const handleOperationError = useHandleOperationError();
  const healthFactor = useHealthFactor();
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

  const borrowLimit = useMemo(
    () => (marketAccount ? getBeforeBorrowLimit(marketAccount, 'borrow') : 0n),
    [marketAccount],
  );
  const hasCollateral = useMemo(() => {
    if (!accountData || !marketAccount) return false;
    return marketAccount.floatingDepositAssets > 0n || accountData.some((aMarket) => aMarket.isCollateral);
  }, [accountData, marketAccount]);
  const safeMaximumBorrow = useMemo((): string => {
    if (!marketAccount || !healthFactor) return '';

    const { adjustFactor, usdPrice, floatingDepositAssets, isCollateral, decimals } = marketAccount;
    let col = healthFactor.collateral;
    const hf = parseUnits('1.05', 18);

    if (!isCollateral && floatingDepositAssets > 0n) {
      col = col + (floatingDepositAssets * adjustFactor) / WAD;
    }

    return Math.max(
      0,
      Number(
        formatUnits(
          ((((((col - (hf * healthFactor.debt) / WAD) * WAD) / hf) * WAD) / usdPrice) * adjustFactor) / WAD,
          18,
        ),
      ),
    ).toFixed(decimals);
  }, [marketAccount, healthFactor]);
  const inputReady = Boolean(
    walletAddress &&
      marketAccount &&
      amount !== undefined &&
      parseFloat(qty) > 0 &&
      marketAccount.floatingAvailableAssets >= (amount ?? 0n) &&
      borrowLimit >= ((amount ?? 0n) * (marketAccount?.usdPrice ?? 0n)) / WAD &&
      hasCollateral,
  );
  const approvalAmount = amount === undefined ? undefined : (amount * 101n) / 100n;
  const { data: marketAllowance, refetch: refetchMarketAllowance } = useReadMarketAllowance({
    address: marketAccount?.market,
    args: walletAddress && marketEthRouter ? [walletAddress, marketEthRouter] : undefined,
    chainId: defaultChain.id,
    query: { enabled: Boolean(walletAddress && marketEthRouter && marketAccount?.assetSymbol === 'WETH') },
  });
  const requiresBatchedApproval = Boolean(
    inputReady &&
      marketAccount?.assetSymbol === 'WETH' &&
      marketAllowance !== undefined &&
      approvalAmount !== undefined &&
      marketAllowance < approvalAmount,
  );
  const approveSimulation = useSimulateMarketApprove({
    address: marketAccount?.market,
    args: marketEthRouter && approvalAmount !== undefined ? [marketEthRouter, approvalAmount] : undefined,
    account: walletAddress,
    chainId: defaultChain.id,
    query: { enabled: requiresBatchedApproval },
  });
  const borrowSimulation = useSimulateMarketBorrow({
    address: marketAccount?.market,
    args: amount !== undefined && walletAddress ? [amount, walletAddress, walletAddress] : undefined,
    account: walletAddress,
    chainId: defaultChain.id,
    query: { enabled: Boolean(inputReady && marketAccount?.assetSymbol !== 'WETH') },
  });
  const ethBorrowSimulation = useSimulateMarketEthRouterBorrow({
    args: amount !== undefined ? [amount] : undefined,
    account: walletAddress,
    chainId: marketEthRouterChainId,
    query: {
      enabled: Boolean(
        inputReady &&
          marketAccount?.assetSymbol === 'WETH' &&
          marketEthRouterChainId !== undefined &&
          marketAllowance !== undefined &&
          approvalAmount !== undefined &&
          marketAllowance >= approvalAmount,
      ),
    },
  });
  const callsStatus = useWaitForCallsStatus({
    id: callId,
    query: { enabled: Boolean(callId) },
  });
  const needsBatchedApproval = useCallback(async () => {
    if (marketAccount?.assetSymbol !== 'WETH' || !walletAddress || !marketEthRouter || approvalAmount === undefined)
      return false;
    return (marketAllowance ?? (await refetchMarketAllowance()).data ?? 0n) < approvalAmount;
  }, [
    approvalAmount,
    marketAccount?.assetSymbol,
    marketAllowance,
    marketEthRouter,
    refetchMarketAllowance,
    walletAddress,
  ]);
  const isLoading = useMemo(() => sendCallsPending || isLoadingOp, [sendCallsPending, isLoadingOp]);
  const isPreparing = useMemo(
    () => approveSimulation.isLoading || borrowSimulation.isLoading || ethBorrowSimulation.isLoading,
    [approveSimulation.isLoading, borrowSimulation.isLoading, ethBorrowSimulation.isLoading],
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
    if (marketAccount.assetSymbol === 'WETH')
      return requiresBatchedApproval ? approveSimulation.error : ethBorrowSimulation.error;
    return borrowSimulation.error;
  }, [
    approveSimulation.error,
    borrowSimulation.error,
    ethBorrowSimulation.error,
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
    if (marketAccount?.assetSymbol === 'WETH') void refetchMarketAllowance();
  }, [callsStatus.data?.receipts, marketAccount?.assetSymbol, refetchMarketAllowance, refetch]);

  useEffect(() => {
    if (!callsStatus.data || !marketAccount || !txHash) return;
    if (callsStatus.data.status !== 'success' && callsStatus.data.status !== 'failure') return;
    track('TX Completed', {
      contractName: marketAccount.assetSymbol === 'WETH' ? 'ETHRouter' : 'Market',
      method: 'borrow',
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
    setQty(safeMaximumBorrow);
    setErrorData(undefined);
  }, [setQty, safeMaximumBorrow, setErrorData]);

  const handleInputChange = useCallback(
    (value: string) => {
      if (!marketAccount) return;

      setQty(value);

      if (!hasCollateral)
        return setErrorData({
          status: true,
          variant: 'warning',
          message: t(
            'In order to borrow you need to have a deposit in the Variable Rate Pool marked as collateral in your Dashboard',
          ),
        });

      if (marketAccount.floatingAvailableAssets < parseUnits(value || '0', marketAccount.decimals)) {
        return setErrorData({ status: true, message: t('There is not enough liquidity') });
      }

      if (borrowLimit < (parseUnits(value || '0', marketAccount.decimals) * marketAccount.usdPrice) / WAD) {
        return setErrorData({ status: true, message: t("You can't borrow more than your borrow limit") });
      }
      setErrorData(undefined);
    },
    [borrowLimit, hasCollateral, marketAccount, setErrorData, setQty, t],
  );

  const handleBasicInputChange = useCallback(
    (value: string) => {
      if (!marketAccount) return;

      setQty(value);

      if (borrowLimit < (parseUnits(value || '0', marketAccount.decimals) * marketAccount.usdPrice) / WAD) {
        return setErrorData({ status: true, message: t("You can't borrow more than your borrow limit") });
      }
      setErrorData(undefined);
    },
    [borrowLimit, marketAccount, setErrorData, setQty, t],
  );

  const borrow = useCallback(async () => {
    if (!walletAddress || !marketAccount || amount === undefined) return;
    setIsLoadingOp(true);
    setCallId(undefined);
    try {
      let id: string;
      if (marketAccount.assetSymbol === 'WETH') {
        if (!marketEthRouter) return;
        if (requiresBatchedApproval && approveSimulation.error) throw approveSimulation.error;
        if (!requiresBatchedApproval && ethBorrowSimulation.error) throw ethBorrowSimulation.error;
        ({ id } = await sendCalls({
          chainId: defaultChain.id,
          experimental_fallback: true,
          calls: [
            ...((await needsBatchedApproval()) && approvalAmount !== undefined
              ? [
                  {
                    to: marketAccount.market,
                    abi: marketAbi,
                    functionName: 'approve',
                    args: [marketEthRouter, approvalAmount],
                  } as const,
                ]
              : []),
            {
              to: marketEthRouter,
              abi: marketEthRouterAbi,
              functionName: 'borrow',
              args: [amount],
            },
          ],
        }));
      } else {
        if (borrowSimulation.error) throw borrowSimulation.error;
        ({ id } = await sendCalls({
          chainId: defaultChain.id,
          experimental_fallback: true,
          calls: [
            {
              to: marketAccount.market,
              abi: marketAbi,
              functionName: 'borrow',
              args: [amount, walletAddress, walletAddress],
            },
          ],
        }));
      }
      setCallId(id);
      track('TX Signed', {
        contractName: marketAccount.assetSymbol === 'WETH' ? 'ETHRouter' : 'Market',
        method: 'borrow',
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
    approvalAmount,
    approveSimulation.error,
    borrowSimulation.error,
    ethBorrowSimulation.error,
    handleOperationError,
    marketAccount,
    marketEthRouter,
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
    return borrow();
  }, [borrow, isLoading]);

  return {
    isLoading,
    isPreparing,
    onMax,
    handleInputChange,
    handleBasicInputChange,
    handleSubmitAction,
    borrow,
    safeMaximumBorrow,
    txStatus,
    txHash,
  };
};
