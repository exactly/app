import React, { FC, useCallback, useEffect, useMemo } from 'react';
import { WAD } from '@exactly/lib';

import ModalGif from 'components/OperationsModal/ModalGif';

import { useOperationContext } from 'contexts/OperationContext';
import useAccountData from 'hooks/useAccountData';
import { Grid } from '@mui/material';
import { ModalBox, ModalBoxCell, ModalBoxRow } from 'components/common/modal/ModalBox';
import AssetInput from 'components/OperationsModal/AssetInput';
import DateSelector from 'components/OperationsModal/DateSelector';
import ModalInfoHealthFactor from 'components/OperationsModal/Info/ModalInfoHealthFactor';
import ModalInfoFixedUtilizationRate from 'components/OperationsModal/Info/ModalInfoFixedUtilizationRate';
import ModalAdvancedSettings from 'components/common/modal/ModalAdvancedSettings';
import ModalInfoEditableSlippage from 'components/OperationsModal/Info/ModalInfoEditableSlippage';
import ModalAlert from 'components/common/modal/ModalAlert';
import ModalSubmit from 'components/OperationsModal/ModalSubmit';
import ModalInfoAmount from 'components/OperationsModal/Info/ModalInfoAmount';
import formatNumber from 'utils/formatNumber';
import ModalInfo from 'components/common/modal/ModalInfo';
import ModalInfoMaturityStatus from 'components/OperationsModal/Info/ModalInfoMaturityStatus';
import useHandleOperationError from 'hooks/useHandleOperationError';
import { useTranslation } from 'react-i18next';
import useTranslateOperation from 'hooks/useTranslateOperation';
import { formatUnits, parseUnits, zeroAddress } from 'viem';
import {
  legacyPreviewerAddress,
  marketAbi,
  marketEthRouterAbi,
  marketEthRouterAddress,
  previewerAddress,
  useReadLegacyPreviewerPreviewWithdrawAtMaturity,
  useReadMarketAllowance,
  useReadMarketPreviewWithdraw,
  useReadPreviewerPreviewWithdrawAtMaturity,
  useSimulateMarketApprove,
  useSimulateMarketEthRouterWithdrawAtMaturity,
  useSimulateMarketWithdrawAtMaturity,
} from 'generated/wagmi';
import { defaultChain } from 'utils/client';
import useReadOnly from 'hooks/useReadOnly';
import { useSendCalls, useWaitForCallsStatus } from 'wagmi';

const legacyPreviewerChainId = Object.keys(legacyPreviewerAddress)
  .map(Number)
  .find((chainId): chainId is keyof typeof legacyPreviewerAddress => chainId === defaultChain.id);
const previewerChainId = Object.keys(previewerAddress)
  .map(Number)
  .find((chainId): chainId is keyof typeof previewerAddress => chainId === defaultChain.id);

const WithdrawAtMaturity: FC = () => {
  const { t } = useTranslation();
  const translateOperation = useTranslateOperation();
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
  } = useOperationContext();

  const handleOperationError = useHandleOperationError();
  const { marketAccount, refreshAccountData } = useAccountData(symbol);
  const { mutateAsync: sendCalls, isPending: sendCallsPending } = useSendCalls();
  const [callId, setCallId] = React.useState<string>();
  const amount = useMemo(() => {
    if (!qty || !marketAccount) return;
    try {
      return parseUnits(qty, marketAccount.decimals);
    } catch {
      return;
    }
  }, [marketAccount, qty]);
  const isEarlyWithdraw = useMemo(() => {
    if (!date) return false;
    return Date.now() / 1000 < date;
  }, [date]);
  const positionAssets = useMemo(() => {
    if (!marketAccount || !date) return 0n;

    const pool = marketAccount.fixedDepositPositions.find(({ maturity }) => maturity === date);
    return pool ? pool.position.principal + pool.position.fee : 0n;
  }, [date, marketAccount]);
  const amountAtFinish = useMemo(
    () => formatUnits(positionAssets, marketAccount?.decimals ?? 18),
    [positionAssets, marketAccount],
  );
  const marketEthRouterChainId = Object.keys(marketEthRouterAddress)
    .map(Number)
    .find((chainId): chainId is keyof typeof marketEthRouterAddress => chainId === defaultChain.id);
  const marketEthRouter =
    marketEthRouterChainId === undefined ? undefined : marketEthRouterAddress[marketEthRouterChainId];
  const legacyWithdrawPreview = useReadLegacyPreviewerPreviewWithdrawAtMaturity({
    chainId: legacyPreviewerChainId,
    args:
      marketAccount && date && amount !== undefined
        ? [marketAccount.market, date, amount, walletAddress ?? zeroAddress]
        : undefined,
    query: {
      enabled: Boolean(
        legacyPreviewerChainId !== undefined &&
          marketAccount &&
          date &&
          amount !== undefined &&
          amount > 0n &&
          amount <= positionAssets,
      ),
    },
  });
  const withdrawPreview = useReadPreviewerPreviewWithdrawAtMaturity({
    chainId: previewerChainId,
    args:
      marketAccount && date && amount !== undefined
        ? [marketAccount.market, date, amount, walletAddress ?? zeroAddress]
        : undefined,
    query: {
      enabled: Boolean(
        legacyPreviewerChainId === undefined &&
          previewerChainId !== undefined &&
          marketAccount &&
          date &&
          amount !== undefined &&
          amount > 0n &&
          amount <= positionAssets,
      ),
    },
  });
  const amountToWithdraw =
    (legacyPreviewerChainId !== undefined ? legacyWithdrawPreview.data?.assets : withdrawPreview.data?.assets) ?? 0n;
  const minAmountToWithdraw = isEarlyWithdraw ? (amountToWithdraw * slippage) / WAD : amountToWithdraw;
  const previewWithdraw = useReadMarketPreviewWithdraw({
    address: marketAccount?.market,
    args: amount !== undefined ? [amount] : undefined,
    chainId: defaultChain.id,
    query: {
      enabled: Boolean(walletAddress && marketAccount?.assetSymbol === 'WETH' && amount !== undefined && amount > 0n),
    },
  });
  const approvalAmount = previewWithdraw.data === undefined ? undefined : (previewWithdraw.data * 101n) / 100n;
  const { data: marketAllowance, refetch: refetchMarketAllowance } = useReadMarketAllowance({
    address: marketAccount?.market,
    args: walletAddress && marketEthRouter ? [walletAddress, marketEthRouter] : undefined,
    chainId: defaultChain.id,
    query: { enabled: Boolean(walletAddress && marketEthRouter && marketAccount?.assetSymbol === 'WETH') },
  });
  const inputReady = Boolean(
    walletAddress &&
      marketAccount &&
      date &&
      amount !== undefined &&
      amount > 0n &&
      amount <= positionAssets &&
      amountToWithdraw > 0n,
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
  const withdrawSimulation = useSimulateMarketWithdrawAtMaturity({
    address: marketAccount?.market,
    args:
      date && amount !== undefined && walletAddress
        ? [date, amount, minAmountToWithdraw, walletAddress, walletAddress]
        : undefined,
    account: walletAddress,
    chainId: defaultChain.id,
    query: { enabled: Boolean(inputReady && marketAccount?.assetSymbol !== 'WETH') },
  });
  const ethWithdrawSimulation = useSimulateMarketEthRouterWithdrawAtMaturity({
    args: date && amount !== undefined ? [date, amount, minAmountToWithdraw] : undefined,
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
    () =>
      approveSimulation.isLoading ||
      withdrawSimulation.isLoading ||
      ethWithdrawSimulation.isLoading ||
      legacyWithdrawPreview.isLoading ||
      withdrawPreview.isLoading ||
      previewWithdraw.isLoading,
    [
      approveSimulation.isLoading,
      ethWithdrawSimulation.isLoading,
      legacyWithdrawPreview.isLoading,
      previewWithdraw.isLoading,
      withdrawPreview.isLoading,
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
    if (marketAccount.assetSymbol === 'WETH')
      return requiresBatchedApproval ? approveSimulation.error : ethWithdrawSimulation.error;
    return withdrawSimulation.error;
  }, [
    approveSimulation.error,
    ethWithdrawSimulation.error,
    inputReady,
    marketAccount,
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

  useEffect(() => {
    if (!qty || amount === undefined) return;
    if (amount === 0n) {
      setErrorData({ status: true, message: t('Cannot withdraw 0'), component: 'input' });
      return;
    }
    if (amount > positionAssets) {
      setErrorData({
        status: true,
        message: t(`You can't withdraw more than the deposited amount`),
        component: 'input',
      });
      return;
    }
    if (errorData?.component === 'input') setErrorData(undefined);
  }, [amount, errorData?.component, positionAssets, qty, setErrorData, t]);

  const onMax = useCallback(
    () => setQty(formatUnits(positionAssets, marketAccount?.decimals ?? 18)),
    [marketAccount, positionAssets, setQty],
  );

  const withdraw = useCallback(async () => {
    if (!walletAddress || !marketAccount || !date || amount === undefined) return;
    setIsLoadingOp(true);
    setCallId(undefined);
    try {
      let id: string;
      if (marketAccount.assetSymbol === 'WETH') {
        if (!marketEthRouter) return;
        if (requiresBatchedApproval && approveSimulation.error) throw approveSimulation.error;
        if (!requiresBatchedApproval && ethWithdrawSimulation.error) throw ethWithdrawSimulation.error;
        ({ id } = await sendCalls({
          account: walletAddress,
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
              functionName: 'withdrawAtMaturity',
              args: [date, amount, minAmountToWithdraw],
            },
          ],
        }));
      } else {
        if (withdrawSimulation.error) throw withdrawSimulation.error;
        ({ id } = await sendCalls({
          account: walletAddress,
          chainId: defaultChain.id,
          experimental_fallback: true,
          calls: [
            {
              to: marketAccount.market,
              abi: marketAbi,
              functionName: 'withdrawAtMaturity',
              args: [date, amount, minAmountToWithdraw, walletAddress, walletAddress],
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
    date,
    ethWithdrawSimulation.error,
    handleOperationError,
    marketAccount,
    marketEthRouter,
    minAmountToWithdraw,
    needsBatchedApproval,
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

  const decimals = marketAccount?.decimals ?? 18;

  return (
    <Grid container flexDirection="column">
      <Grid item>
        <ModalBox>
          <ModalBoxRow>
            <AssetInput
              qty={qty}
              symbol={symbol}
              decimals={decimals}
              onMax={onMax}
              onChange={setQty}
              label={t('Deposited')}
              amount={amountAtFinish}
            />
          </ModalBoxRow>
          <ModalBoxRow>
            <ModalBoxCell>
              <DateSelector />
            </ModalBoxCell>
            <ModalBoxCell>{date !== undefined && <ModalInfoMaturityStatus date={Number(date)} />}</ModalBoxCell>
            <ModalBoxCell>
              <ModalInfoAmount
                label={t('Amount at maturity')}
                symbol={symbol}
                value={formatNumber(amountAtFinish, symbol, true)}
              />
            </ModalBoxCell>
            <ModalBoxCell>
              <ModalInfoAmount
                label={t('Amount to receive')}
                value={formatNumber(formatUnits(amountToWithdraw, decimals), symbol, true)}
                symbol={symbol}
              />
            </ModalBoxCell>
          </ModalBoxRow>
          <ModalBoxRow>
            <ModalBoxCell>
              <ModalInfoHealthFactor qty={qty} symbol={symbol} operation="withdrawAtMaturity" />
            </ModalBoxCell>
          </ModalBoxRow>
        </ModalBox>
      </Grid>

      <Grid item mt={2}>
        <ModalAdvancedSettings>
          <ModalInfo label={t('Min amount to withdraw')} variant="row">
            {formatNumber(formatUnits(minAmountToWithdraw, decimals), symbol, true)}
          </ModalInfo>
          {isEarlyWithdraw && (
            <ModalInfoEditableSlippage value={rawSlippage} onChange={(e) => setRawSlippage(e.target.value)} />
          )}
          {isEarlyWithdraw && (
            <ModalInfoFixedUtilizationRate qty={qty} symbol={symbol} operation="withdrawAtMaturity" variant="row" />
          )}
        </ModalAdvancedSettings>
      </Grid>

      {errorData?.status && (
        <Grid item mt={1}>
          <ModalAlert variant={errorData.variant} message={errorData.message} />
        </Grid>
      )}

      <Grid item mt={{ xs: 2, sm: 3 }}>
        <ModalSubmit
          label={translateOperation('withdrawAtMaturity', { capitalize: true })}
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

export default React.memo(WithdrawAtMaturity);
