import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { WAD } from '@exactly/lib';

import ModalGif from 'components/OperationsModal/ModalGif';

import useBalance from 'hooks/useBalance';
import { useOperationContext } from 'contexts/OperationContext';
import { Grid } from '@mui/material';
import { ModalBox, ModalBoxCell, ModalBoxRow } from 'components/common/modal/ModalBox';
import AssetInput from 'components/OperationsModal/AssetInput';
import ModalInfoHealthFactor from 'components/OperationsModal/Info/ModalInfoHealthFactor';
import ModalInfoTotalBorrows from 'components/OperationsModal/Info/ModalInfoTotalBorrows';
import ModalAdvancedSettings from 'components/common/modal/ModalAdvancedSettings';
import ModalInfoBorrowLimit from 'components/OperationsModal/Info/ModalInfoBorrowLimit';
import ModalInfoFloatingUtilizationRate from 'components/OperationsModal/Info/ModalInfoFloatingUtilizationRate';
import ModalAlert from 'components/common/modal/ModalAlert';
import ModalSubmit from 'components/OperationsModal/ModalSubmit';
import usePreviewerExactly from 'hooks/usePreviewerExactly';
import useHandleOperationError from 'hooks/useHandleOperationError';
import { useTranslation } from 'react-i18next';
import useTranslateOperation from 'hooks/useTranslateOperation';
import { ETH_ROUTER_SLIPPAGE } from 'utils/const';
import { formatUnits, parseUnits } from 'viem';
import useReadOnly from 'hooks/useReadOnly';
import { defaultChain } from 'utils/client';
import {
  erc20Abi,
  marketAbi,
  marketEthRouterAbi,
  marketEthRouterAddress,
  useReadErc20Allowance,
  useSimulateErc20Approve,
  useSimulateMarketEthRouterRefund,
  useSimulateMarketEthRouterRepay,
  useSimulateMarketRefund,
  useSimulateMarketRepay,
} from 'generated/wagmi';
import { useSendCalls, useWaitForCallsStatus } from 'wagmi';

function Repay() {
  const { t } = useTranslation();
  const translateOperation = useTranslateOperation();
  const { account: walletAddress } = useReadOnly();

  const {
    operation,
    symbol,
    errorData,
    setErrorData,
    qty,
    setQty,
    isLoading: isLoadingOp,
    setIsLoading: setIsLoadingOp,
  } = useOperationContext();

  const handleOperationError = useHandleOperationError();
  const { data, refetch } = usePreviewerExactly();
  const marketAccount = data?.find((market) => market.assetSymbol === symbol);
  const [isMax, setIsMax] = useState(false);
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
  const finalAmount = useMemo(() => {
    if (!marketAccount) return '0';
    return formatUnits(marketAccount.floatingBorrowAssets, marketAccount.decimals);
  }, [marketAccount]);
  const marketEthRouterChainId = Object.keys(marketEthRouterAddress)
    .map(Number)
    .find((chainId): chainId is keyof typeof marketEthRouterAddress => chainId === defaultChain.id);
  const marketEthRouter =
    marketEthRouterChainId === undefined ? undefined : marketEthRouterAddress[marketEthRouterChainId];
  const approvalAmount =
    !marketAccount || marketAccount.assetSymbol === 'WETH' || amount === undefined
      ? undefined
      : ((isMax ? marketAccount.floatingBorrowAssets : amount) * 101n) / 100n;
  const { data: allowance, refetch: refetchAllowance } = useReadErc20Allowance({
    address: marketAccount?.asset,
    args: walletAddress && marketAccount ? [walletAddress, marketAccount.market] : undefined,
    chainId: defaultChain.id,
    query: { enabled: Boolean(walletAddress && marketAccount && marketAccount.assetSymbol !== 'WETH') },
  });
  const ethValue =
    marketAccount?.assetSymbol === 'WETH' && amount !== undefined
      ? ((isMax ? marketAccount.floatingBorrowAssets : amount) * ETH_ROUTER_SLIPPAGE) / WAD
      : undefined;
  const inputReady = Boolean(
    walletAddress &&
      marketAccount &&
      amount !== undefined &&
      parseFloat(qty) > 0 &&
      (!walletBalance || parseFloat(qty) <= parseFloat(walletBalance)),
  );
  const requiresBatchedApproval = Boolean(
    inputReady &&
      marketAccount?.assetSymbol !== 'WETH' &&
      allowance !== undefined &&
      approvalAmount !== undefined &&
      allowance < approvalAmount,
  );
  const approveSimulation = useSimulateErc20Approve({
    address: marketAccount?.asset,
    args: marketAccount && approvalAmount !== undefined ? [marketAccount.market, approvalAmount] : undefined,
    account: walletAddress,
    chainId: defaultChain.id,
    query: { enabled: requiresBatchedApproval },
  });
  const repaySimulation = useSimulateMarketRepay({
    address: marketAccount?.market,
    args: amount !== undefined && walletAddress ? [amount, walletAddress] : undefined,
    account: walletAddress,
    chainId: defaultChain.id,
    query: {
      enabled: Boolean(inputReady && marketAccount?.assetSymbol !== 'WETH' && !isMax && !requiresBatchedApproval),
    },
  });
  const refundSimulation = useSimulateMarketRefund({
    address: marketAccount?.market,
    args: marketAccount && walletAddress ? [marketAccount.floatingBorrowShares, walletAddress] : undefined,
    account: walletAddress,
    chainId: defaultChain.id,
    query: {
      enabled: Boolean(inputReady && marketAccount?.assetSymbol !== 'WETH' && isMax && !requiresBatchedApproval),
    },
  });
  const ethRepaySimulation = useSimulateMarketEthRouterRepay({
    args: amount !== undefined ? [amount] : undefined,
    account: walletAddress,
    chainId: marketEthRouterChainId,
    value: ethValue,
    query: {
      enabled: Boolean(
        inputReady && marketAccount?.assetSymbol === 'WETH' && !isMax && marketEthRouterChainId !== undefined,
      ),
    },
  });
  const ethRefundSimulation = useSimulateMarketEthRouterRefund({
    args: marketAccount ? [marketAccount.floatingBorrowShares] : undefined,
    account: walletAddress,
    chainId: marketEthRouterChainId,
    value: ethValue,
    query: {
      enabled: Boolean(
        inputReady && marketAccount?.assetSymbol === 'WETH' && isMax && marketEthRouterChainId !== undefined,
      ),
    },
  });
  const callsStatus = useWaitForCallsStatus({
    id: callId,
    query: { enabled: Boolean(callId) },
  });
  const needsBatchedApproval = useCallback(async () => {
    if (marketAccount?.assetSymbol === 'WETH' || !walletAddress || !marketAccount || approvalAmount === undefined)
      return false;
    return (allowance ?? (await refetchAllowance()).data ?? 0n) < approvalAmount;
  }, [allowance, approvalAmount, marketAccount, refetchAllowance, walletAddress]);
  const isLoading = useMemo(() => sendCallsPending || isLoadingOp, [sendCallsPending, isLoadingOp]);
  const isPreparing = useMemo(
    () =>
      approveSimulation.isLoading ||
      repaySimulation.isLoading ||
      refundSimulation.isLoading ||
      ethRepaySimulation.isLoading ||
      ethRefundSimulation.isLoading,
    [
      approveSimulation.isLoading,
      ethRefundSimulation.isLoading,
      ethRepaySimulation.isLoading,
      refundSimulation.isLoading,
      repaySimulation.isLoading,
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
    if (marketAccount.assetSymbol === 'WETH') return isMax ? ethRefundSimulation.error : ethRepaySimulation.error;
    if (requiresBatchedApproval) return approveSimulation.error;
    return isMax ? refundSimulation.error : repaySimulation.error;
  }, [
    approveSimulation.error,
    ethRefundSimulation.error,
    ethRepaySimulation.error,
    inputReady,
    isMax,
    marketAccount,
    refundSimulation.error,
    repaySimulation.error,
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

  const onMax = useCallback(() => {
    setQty(finalAmount);
    setIsMax(true);

    if (walletBalance && parseFloat(finalAmount) > parseFloat(walletBalance)) {
      return setErrorData({
        status: true,
        message: t("You can't repay more than you have in your wallet"),
        component: 'input',
      });
    }

    setErrorData(undefined);
  }, [finalAmount, setErrorData, setQty, t, walletBalance]);

  const handleInputChange = useCallback(
    (value: string) => {
      setQty(value);

      if (walletBalance && parseFloat(value) > parseFloat(walletBalance)) {
        return setErrorData({
          status: true,
          message: t("You can't repay more than you have in your wallet"),
          component: 'input',
        });
      }

      setErrorData(undefined);
      setIsMax(value === finalAmount);
    },
    [finalAmount, setErrorData, setQty, t, walletBalance],
  );

  const repay = useCallback(async () => {
    if (!walletAddress || !marketAccount || amount === undefined) return;
    setIsLoadingOp(true);
    setCallId(undefined);
    try {
      let id: string;
      if (marketAccount.assetSymbol === 'WETH') {
        if (!marketEthRouter || ethValue === undefined) return;
        if (isMax ? ethRefundSimulation.error : ethRepaySimulation.error) {
          throw isMax ? ethRefundSimulation.error : ethRepaySimulation.error;
        }
        ({ id } = await sendCalls({
          chainId: defaultChain.id,
          experimental_fallback: true,
          calls: [
            isMax
              ? {
                  to: marketEthRouter,
                  abi: marketEthRouterAbi,
                  functionName: 'refund',
                  args: [marketAccount.floatingBorrowShares],
                  value: ethValue,
                }
              : {
                  to: marketEthRouter,
                  abi: marketEthRouterAbi,
                  functionName: 'repay',
                  args: [amount],
                  value: ethValue,
                },
          ],
        }));
      } else {
        if (requiresBatchedApproval && approveSimulation.error) throw approveSimulation.error;
        if (!requiresBatchedApproval && (isMax ? refundSimulation.error : repaySimulation.error)) {
          throw isMax ? refundSimulation.error : repaySimulation.error;
        }
        ({ id } = await sendCalls({
          chainId: defaultChain.id,
          experimental_fallback: true,
          calls: [
            ...((await needsBatchedApproval()) && approvalAmount !== undefined
              ? [
                  {
                    to: marketAccount.asset,
                    abi: erc20Abi,
                    functionName: 'approve',
                    args: [marketAccount.market, approvalAmount],
                  } as const,
                ]
              : []),
            isMax
              ? {
                  to: marketAccount.market,
                  abi: marketAbi,
                  functionName: 'refund',
                  args: [marketAccount.floatingBorrowShares, walletAddress],
                }
              : {
                  to: marketAccount.market,
                  abi: marketAbi,
                  functionName: 'repay',
                  args: [amount, walletAddress],
                },
          ],
        }));
      }
      setCallId(id);
    } catch (error) {
      setErrorData({ status: true, message: handleOperationError(error) });
    } finally {
      setIsLoadingOp(false);
    }
  }, [
    amount,
    approvalAmount,
    approveSimulation.error,
    ethRefundSimulation.error,
    ethRepaySimulation.error,
    handleOperationError,
    isMax,
    marketAccount,
    marketEthRouter,
    needsBatchedApproval,
    refundSimulation.error,
    repaySimulation.error,
    requiresBatchedApproval,
    sendCalls,
    setErrorData,
    setIsLoadingOp,
    ethValue,
    walletAddress,
  ]);

  const handleSubmitAction = useCallback(async () => {
    if (isLoading) return;
    return repay();
  }, [isLoading, repay]);

  if (txStatus) return <ModalGif status={txStatus} hash={txHash} tryAgain={repay} />;

  return (
    <Grid container flexDirection="column">
      <Grid item>
        <ModalBox>
          <ModalBoxRow>
            <AssetInput
              qty={qty}
              symbol={symbol}
              decimals={marketAccount?.decimals ?? 18}
              onMax={onMax}
              onChange={handleInputChange}
              label={t('Your balance')}
              amount={walletBalance}
            />
          </ModalBoxRow>
          <ModalBoxRow>
            <ModalBoxCell>
              <ModalInfoHealthFactor qty={qty} symbol={symbol} operation={operation} />
            </ModalBoxCell>
            <ModalBoxCell divisor>
              <ModalInfoTotalBorrows qty={qty} symbol={symbol} operation="repay" />
            </ModalBoxCell>
          </ModalBoxRow>
        </ModalBox>
      </Grid>

      <Grid item mt={2}>
        <ModalAdvancedSettings>
          <ModalInfoBorrowLimit qty={qty} symbol={symbol} operation={operation} variant="row" />
          <ModalInfoFloatingUtilizationRate qty={qty} symbol={symbol} operation="repay" variant="row" />
        </ModalAdvancedSettings>
      </Grid>

      {errorData?.status && (
        <Grid item mt={1}>
          <ModalAlert variant={errorData.variant} message={errorData.message} />
        </Grid>
      )}

      <Grid item mt={{ xs: 2, sm: 3 }}>
        <ModalSubmit
          label={translateOperation(operation, { capitalize: true })}
          symbol={symbol}
          submit={handleSubmitAction}
          isLoading={isLoading || isPreparing}
          disabled={!qty || parseFloat(qty) <= 0 || isLoading || isPreparing || errorData?.status}
          refreshOnSubmit={false}
        />
      </Grid>
    </Grid>
  );
}

export default React.memo(Repay);
