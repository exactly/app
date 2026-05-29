import React, { FC, useCallback, useEffect, useMemo, useState } from 'react';

import ModalGif from 'components/OperationsModal/ModalGif';

import { useOperationContext } from 'contexts/OperationContext';
import { Grid } from '@mui/material';
import { ModalBox, ModalBoxCell, ModalBoxRow } from 'components/common/modal/ModalBox';
import AssetInput from 'components/OperationsModal/AssetInput';
import ModalInfoHealthFactor from 'components/OperationsModal/Info/ModalInfoHealthFactor';
import ModalInfoTotalDeposits from 'components/OperationsModal/Info/ModalInfoTotalDeposits';
import ModalAdvancedSettings from 'components/common/modal/ModalAdvancedSettings';
import ModalInfoFloatingUtilizationRate from 'components/OperationsModal/Info/ModalInfoFloatingUtilizationRate';
import ModalInfoBorrowLimit from 'components/OperationsModal/Info/ModalInfoBorrowLimit';
import ModalAlert from 'components/common/modal/ModalAlert';
import ModalSubmit from 'components/OperationsModal/ModalSubmit';
import useAccountData from 'hooks/useAccountData';
import useHandleOperationError from 'hooks/useHandleOperationError';
import { useTranslation } from 'react-i18next';
import useTranslateOperation from 'hooks/useTranslateOperation';
import { formatUnits, parseUnits } from 'viem';
import useReadOnly from 'hooks/useReadOnly';
import { defaultChain } from 'utils/client';
import {
  marketAbi,
  marketEthRouterAbi,
  marketEthRouterAddress,
  useReadMarketAllowance,
  useReadMarketPreviewWithdraw,
  useSimulateMarketApprove,
  useSimulateMarketEthRouterRedeem,
  useSimulateMarketEthRouterWithdraw,
  useSimulateMarketRedeem,
  useSimulateMarketWithdraw,
} from 'generated/wagmi';
import { useSendCalls, useWaitForCallsStatus } from 'wagmi';

const Withdraw: FC = () => {
  const { t } = useTranslation();
  const translateOperation = useTranslateOperation();
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

  const handleOperationError = useHandleOperationError();
  const { marketAccount, refreshAccountData } = useAccountData(symbol);
  const [isMax, setIsMax] = useState(false);
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
  const parsedAmount = useMemo(() => {
    if (!marketAccount) return '0';
    return formatUnits(marketAccount.floatingDepositAssets, marketAccount.decimals);
  }, [marketAccount]);
  const marketEthRouterChainId = Object.keys(marketEthRouterAddress)
    .map(Number)
    .find((chainId): chainId is keyof typeof marketEthRouterAddress => chainId === defaultChain.id);
  const marketEthRouter =
    marketEthRouterChainId === undefined ? undefined : marketEthRouterAddress[marketEthRouterChainId];
  const previewWithdraw = useReadMarketPreviewWithdraw({
    address: marketAccount?.market,
    args: amount !== undefined ? [amount] : undefined,
    chainId: defaultChain.id,
    query: {
      enabled: Boolean(walletAddress && marketAccount?.assetSymbol === 'WETH' && !isMax && amount !== undefined),
    },
  });
  const approvalAmount = isMax ? marketAccount?.floatingDepositShares : previewWithdraw.data;
  const { data: marketAllowance, refetch: refetchMarketAllowance } = useReadMarketAllowance({
    address: marketAccount?.market,
    args: walletAddress && marketEthRouter ? [walletAddress, marketEthRouter] : undefined,
    chainId: defaultChain.id,
    query: { enabled: Boolean(walletAddress && marketEthRouter && marketAccount?.assetSymbol === 'WETH') },
  });
  const inputReady = Boolean(
    walletAddress &&
      marketAccount &&
      amount !== undefined &&
      parseFloat(qty) > 0 &&
      amount <= marketAccount.floatingDepositAssets,
  );
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
  const withdrawSimulation = useSimulateMarketWithdraw({
    address: marketAccount?.market,
    args: amount !== undefined && walletAddress ? [amount, walletAddress, walletAddress] : undefined,
    account: walletAddress,
    chainId: defaultChain.id,
    query: { enabled: Boolean(inputReady && marketAccount?.assetSymbol !== 'WETH' && !isMax) },
  });
  const redeemSimulation = useSimulateMarketRedeem({
    address: marketAccount?.market,
    args:
      marketAccount && walletAddress ? [marketAccount.floatingDepositShares, walletAddress, walletAddress] : undefined,
    account: walletAddress,
    chainId: defaultChain.id,
    query: { enabled: Boolean(inputReady && marketAccount?.assetSymbol !== 'WETH' && isMax) },
  });
  const ethWithdrawSimulation = useSimulateMarketEthRouterWithdraw({
    args: amount !== undefined ? [amount] : undefined,
    account: walletAddress,
    chainId: marketEthRouterChainId,
    query: {
      enabled: Boolean(
        inputReady &&
          marketAccount?.assetSymbol === 'WETH' &&
          !isMax &&
          marketEthRouterChainId !== undefined &&
          marketAllowance !== undefined &&
          approvalAmount !== undefined &&
          marketAllowance >= approvalAmount,
      ),
    },
  });
  const ethRedeemSimulation = useSimulateMarketEthRouterRedeem({
    args: marketAccount ? [marketAccount.floatingDepositShares] : undefined,
    account: walletAddress,
    chainId: marketEthRouterChainId,
    query: {
      enabled: Boolean(
        inputReady &&
          marketAccount?.assetSymbol === 'WETH' &&
          isMax &&
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
    () =>
      approveSimulation.isLoading ||
      withdrawSimulation.isLoading ||
      redeemSimulation.isLoading ||
      ethWithdrawSimulation.isLoading ||
      ethRedeemSimulation.isLoading ||
      previewWithdraw.isLoading,
    [
      approveSimulation.isLoading,
      ethRedeemSimulation.isLoading,
      ethWithdrawSimulation.isLoading,
      previewWithdraw.isLoading,
      redeemSimulation.isLoading,
      withdrawSimulation.isLoading,
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
    if (marketAccount.assetSymbol === 'WETH') {
      if (requiresBatchedApproval) return approveSimulation.error;
      return isMax ? ethRedeemSimulation.error : ethWithdrawSimulation.error;
    }
    return isMax ? redeemSimulation.error : withdrawSimulation.error;
  }, [
    approveSimulation.error,
    ethRedeemSimulation.error,
    ethWithdrawSimulation.error,
    inputReady,
    isMax,
    marketAccount,
    redeemSimulation.error,
    requiresBatchedApproval,
    withdrawSimulation.error,
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
    void refreshAccountData();
    if (marketAccount?.assetSymbol === 'WETH') void refetchMarketAllowance();
  }, [callsStatus.data?.receipts, marketAccount?.assetSymbol, refetchMarketAllowance, refreshAccountData]);

  const onMax = useCallback(() => {
    setQty(parsedAmount);
    setErrorData(undefined);
    setIsMax(true);
  }, [parsedAmount, setErrorData, setQty]);

  const handleInputChange = useCallback(
    (value: string) => {
      if (!marketAccount) return;

      setQty(value);

      if (parseUnits(value || '0', marketAccount.decimals) > marketAccount.floatingDepositAssets) {
        return setErrorData({ status: true, message: t("You can't withdraw more than the deposited amount") });
      }

      setErrorData(undefined);
      setIsMax(value === parsedAmount);
    },
    [marketAccount, parsedAmount, setErrorData, setQty, t],
  );

  const withdraw = useCallback(async () => {
    if (!walletAddress || !marketAccount || amount === undefined) return;
    setIsLoadingOp(true);
    setCallId(undefined);
    try {
      let id: string;
      if (marketAccount.assetSymbol === 'WETH') {
        if (!marketEthRouter) return;
        if (requiresBatchedApproval && approveSimulation.error) throw approveSimulation.error;
        if (!requiresBatchedApproval && (isMax ? ethRedeemSimulation.error : ethWithdrawSimulation.error)) {
          throw isMax ? ethRedeemSimulation.error : ethWithdrawSimulation.error;
        }
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
            isMax
              ? {
                  to: marketEthRouter,
                  abi: marketEthRouterAbi,
                  functionName: 'redeem',
                  args: [marketAccount.floatingDepositShares],
                }
              : {
                  to: marketEthRouter,
                  abi: marketEthRouterAbi,
                  functionName: 'withdraw',
                  args: [amount],
                },
          ],
        }));
      } else {
        if (isMax ? redeemSimulation.error : withdrawSimulation.error) {
          throw isMax ? redeemSimulation.error : withdrawSimulation.error;
        }
        ({ id } = await sendCalls({
          chainId: defaultChain.id,
          experimental_fallback: true,
          calls: [
            isMax
              ? {
                  to: marketAccount.market,
                  abi: marketAbi,
                  functionName: 'redeem',
                  args: [marketAccount.floatingDepositShares, walletAddress, walletAddress],
                }
              : {
                  to: marketAccount.market,
                  abi: marketAbi,
                  functionName: 'withdraw',
                  args: [amount, walletAddress, walletAddress],
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
    ethRedeemSimulation.error,
    ethWithdrawSimulation.error,
    handleOperationError,
    isMax,
    marketAccount,
    marketEthRouter,
    needsBatchedApproval,
    redeemSimulation.error,
    requiresBatchedApproval,
    sendCalls,
    setErrorData,
    setIsLoadingOp,
    walletAddress,
    withdrawSimulation.error,
  ]);

  const handleSubmitAction = useCallback(async () => {
    if (isLoading) return;
    return withdraw();
  }, [isLoading, withdraw]);

  if (txStatus) return <ModalGif status={txStatus} hash={txHash} tryAgain={withdraw} />;

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
              label={t('Available')}
              amount={parsedAmount}
            />
          </ModalBoxRow>
          <ModalBoxRow>
            <ModalBoxCell>
              <ModalInfoHealthFactor qty={qty} symbol={symbol} operation="withdraw" />
            </ModalBoxCell>
            <ModalBoxCell divisor>
              <ModalInfoTotalDeposits qty={qty} symbol={symbol} operation="withdraw" />
            </ModalBoxCell>
          </ModalBoxRow>
        </ModalBox>
      </Grid>

      <Grid item mt={2}>
        <ModalAdvancedSettings>
          <ModalInfoBorrowLimit qty={qty} symbol={symbol} operation="withdraw" variant="row" />
          <ModalInfoFloatingUtilizationRate qty={qty} symbol={symbol} operation="withdraw" variant="row" />
        </ModalAdvancedSettings>
      </Grid>

      {errorData?.status && (
        <Grid item mt={1}>
          <ModalAlert variant={errorData.variant} message={errorData.message} />
        </Grid>
      )}

      <Grid item mt={{ xs: 2, sm: 3 }}>
        <ModalSubmit
          label={translateOperation('withdraw', { capitalize: true })}
          symbol={symbol === 'WETH' && marketAccount ? marketAccount.symbol : symbol}
          submit={handleSubmitAction}
          isLoading={isLoading || isPreparing}
          disabled={!qty || parseFloat(qty) <= 0 || isLoading || isPreparing || errorData?.status}
          refreshOnSubmit={false}
        />
      </Grid>
    </Grid>
  );
};

export default React.memo(Withdraw);
