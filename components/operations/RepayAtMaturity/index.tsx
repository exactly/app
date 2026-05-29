import React, { FC, useCallback, useEffect, useMemo, useState } from 'react';
import { WAD } from '@exactly/lib';

import ModalGif from 'components/OperationsModal/ModalGif';

import formatNumber from 'utils/formatNumber';

import useBalance from 'hooks/useBalance';
import { useOperationContext } from 'contexts/OperationContext';
import useAccountData from 'hooks/useAccountData';
import { Grid } from '@mui/material';
import { ModalBox, ModalBoxCell, ModalBoxRow } from 'components/common/modal/ModalBox';
import AssetInput from 'components/OperationsModal/AssetInput';
import DateSelector from 'components/OperationsModal/DateSelector';
import ModalInfoMaturityStatus from 'components/OperationsModal/Info/ModalInfoMaturityStatus';
import ModalInfoAmount from 'components/OperationsModal/Info/ModalInfoAmount';
import ModalInfoHealthFactor from 'components/OperationsModal/Info/ModalInfoHealthFactor';
import ModalInfoFixedUtilizationRate from 'components/OperationsModal/Info/ModalInfoFixedUtilizationRate';
import ModalAdvancedSettings from 'components/common/modal/ModalAdvancedSettings';
import ModalInfoEditableSlippage from 'components/OperationsModal/Info/ModalInfoEditableSlippage';
import ModalAlert from 'components/common/modal/ModalAlert';
import ModalSubmit from 'components/OperationsModal/ModalSubmit';
import ModalInfoBorrowLimit from 'components/OperationsModal/Info/ModalInfoBorrowLimit';
import useHandleOperationError from 'hooks/useHandleOperationError';
import { useTranslation } from 'react-i18next';
import useTranslateOperation from 'hooks/useTranslateOperation';
import ModalInfoRepayWithDiscount from 'components/OperationsModal/Info/ModalInfoRepayWithDiscount';
import { formatUnits, parseUnits, zeroAddress } from 'viem';
import dayjs from 'dayjs';
import {
  erc20Abi,
  legacyPreviewerAddress,
  marketAbi,
  marketEthRouterAbi,
  marketEthRouterAddress,
  previewerAddress,
  useReadErc20Allowance,
  useReadLegacyPreviewerPreviewRepayAtMaturity,
  useReadPreviewerPreviewRepayAtMaturity,
  useSimulateErc20Approve,
  useSimulateMarketEthRouterRepayAtMaturity,
  useSimulateMarketRepayAtMaturity,
} from 'generated/wagmi';
import { defaultChain } from 'utils/client';
import useReadOnly from 'hooks/useReadOnly';
import { useSendCalls, useWaitForCallsStatus } from 'wagmi';

type RepayWithDiscount = {
  principal: string;
  feeAtMaturity: string;
  amountWithDiscount: string;
  discount: string;
};

const legacyPreviewerChainId = Object.keys(legacyPreviewerAddress)
  .map(Number)
  .find((chainId): chainId is keyof typeof legacyPreviewerAddress => chainId === defaultChain.id);
const previewerChainId = Object.keys(previewerAddress)
  .map(Number)
  .find((chainId): chainId is keyof typeof previewerAddress => chainId === defaultChain.id);

const RepayAtMaturity: FC = () => {
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
  const [penaltyAssets, setPenaltyAssets] = useState(0n);
  const [positionAssetsAmount, setPositionAssetsAmount] = useState(0n);
  const { marketAccount, refreshAccountData } = useAccountData(symbol);
  const walletBalance = useBalance(symbol, marketAccount?.asset);
  const { mutateAsync: sendCalls, isPending: sendCallsPending } = useSendCalls();
  const [callId, setCallId] = useState<string>();
  const isLateRepay = useMemo(() => date !== undefined && BigInt(dayjs().unix()) > date, [date]);
  const totalPositionAssets = useMemo(() => {
    if (!marketAccount || !date) return 0n;
    const pool = marketAccount.fixedBorrowPositions.find(({ maturity }) => maturity === date);
    return pool ? pool.position.principal + pool.position.fee : 0n;
  }, [date, marketAccount]);
  const totalPenalties = useMemo(() => {
    if (!marketAccount || !date || !isLateRepay) return 0n;

    return (marketAccount.penaltyRate * (BigInt(dayjs().unix()) - date) * totalPositionAssets) / WAD;
  }, [marketAccount, date, isLateRepay, totalPositionAssets]);
  const maxAmountToRepay = useMemo(
    () => ((positionAssetsAmount + penaltyAssets) * slippage) / WAD,
    [positionAssetsAmount, penaltyAssets, slippage],
  );
  const legacyRepayPreview = useReadLegacyPreviewerPreviewRepayAtMaturity({
    chainId: legacyPreviewerChainId,
    args:
      marketAccount && date && positionAssetsAmount > 0n
        ? [marketAccount.market, date, positionAssetsAmount, walletAddress ?? zeroAddress]
        : undefined,
    query: {
      enabled: Boolean(
        legacyPreviewerChainId !== undefined && marketAccount && date && positionAssetsAmount > 0n && !isLateRepay,
      ),
    },
  });
  const repayPreview = useReadPreviewerPreviewRepayAtMaturity({
    chainId: previewerChainId,
    args:
      marketAccount && date && positionAssetsAmount > 0n
        ? [marketAccount.market, date, positionAssetsAmount, walletAddress ?? zeroAddress]
        : undefined,
    query: {
      enabled: Boolean(
        legacyPreviewerChainId === undefined &&
          previewerChainId !== undefined &&
          marketAccount &&
          date &&
          positionAssetsAmount > 0n &&
          !isLateRepay,
      ),
    },
  });
  const previewData = useMemo<RepayWithDiscount | undefined>(() => {
    if (!marketAccount || !date || positionAssetsAmount === 0n || totalPositionAssets === 0n) return;

    const pool = marketAccount.fixedBorrowPositions.find(({ maturity }) => maturity === date);
    const previewAssets =
      legacyPreviewerChainId !== undefined ? legacyRepayPreview.data?.assets : repayPreview.data?.assets;
    if (!pool || previewAssets === undefined) return;

    const feeAtMaturity =
      ((((positionAssetsAmount > pool.position.principal ? pool.position.principal : positionAssetsAmount) *
        pool.position.fee) /
        WAD) *
        WAD) /
      pool.position.principal;
    const principal = positionAssetsAmount - feeAtMaturity;
    const discount = previewAssets - positionAssetsAmount;

    return {
      principal: formatNumber(formatUnits(principal, marketAccount.decimals), marketAccount.symbol, true),
      amountWithDiscount: formatNumber(formatUnits(previewAssets, marketAccount.decimals), marketAccount.symbol, true),
      feeAtMaturity: formatNumber(formatUnits(feeAtMaturity, marketAccount.decimals), marketAccount.symbol, true),
      discount: formatNumber(formatUnits(discount, marketAccount.decimals), marketAccount.symbol, true),
    };
  }, [
    date,
    legacyRepayPreview.data?.assets,
    marketAccount,
    positionAssetsAmount,
    repayPreview.data?.assets,
    totalPositionAssets,
  ]);
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
      date &&
      positionAssetsAmount > 0n &&
      maxAmountToRepay > 0n &&
      (!walletBalance || parseUnits(walletBalance, marketAccount.decimals) >= positionAssetsAmount + penaltyAssets),
  );
  const requiresBatchedApproval = Boolean(
    inputReady && marketAccount?.assetSymbol !== 'WETH' && allowance !== undefined && allowance < maxAmountToRepay,
  );
  const approveSimulation = useSimulateErc20Approve({
    address: marketAccount?.asset,
    args: marketAccount ? [marketAccount.market, maxAmountToRepay] : undefined,
    account: walletAddress,
    chainId: defaultChain.id,
    query: { enabled: requiresBatchedApproval },
  });
  const repaySimulation = useSimulateMarketRepayAtMaturity({
    address: marketAccount?.market,
    args: date && walletAddress ? [date, positionAssetsAmount, maxAmountToRepay, walletAddress] : undefined,
    account: walletAddress,
    chainId: defaultChain.id,
    query: { enabled: Boolean(inputReady && marketAccount?.assetSymbol !== 'WETH' && !requiresBatchedApproval) },
  });
  const ethRepaySimulation = useSimulateMarketEthRouterRepayAtMaturity({
    args: date ? [date, positionAssetsAmount] : undefined,
    account: walletAddress,
    chainId: marketEthRouterChainId,
    value: maxAmountToRepay,
    query: {
      enabled: Boolean(inputReady && marketAccount?.assetSymbol === 'WETH' && marketEthRouterChainId !== undefined),
    },
  });
  const callsStatus = useWaitForCallsStatus({
    id: callId,
    query: { enabled: Boolean(callId) },
  });
  const needsBatchedApproval = useCallback(async () => {
    if (marketAccount?.assetSymbol === 'WETH' || !walletAddress || !marketAccount) return false;
    return (allowance ?? (await refetchAllowance()).data ?? 0n) < maxAmountToRepay;
  }, [allowance, marketAccount, maxAmountToRepay, refetchAllowance, walletAddress]);
  const isLoading = useMemo(() => sendCallsPending || isLoadingOp, [sendCallsPending, isLoadingOp]);
  const isPreparing = useMemo(
    () =>
      approveSimulation.isLoading ||
      repaySimulation.isLoading ||
      ethRepaySimulation.isLoading ||
      legacyRepayPreview.isLoading ||
      repayPreview.isLoading,
    [
      approveSimulation.isLoading,
      ethRepaySimulation.isLoading,
      legacyRepayPreview.isLoading,
      repayPreview.isLoading,
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
    if (marketAccount.assetSymbol === 'WETH') return ethRepaySimulation.error;
    if (requiresBatchedApproval) return approveSimulation.error;
    return repaySimulation.error;
  }, [
    approveSimulation.error,
    ethRepaySimulation.error,
    inputReady,
    marketAccount,
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
    void refreshAccountData();
    if (marketAccount?.assetSymbol !== 'WETH') void refetchAllowance();
  }, [callsStatus.data?.receipts, marketAccount?.assetSymbol, refetchAllowance, refreshAccountData]);

  const onMax = useCallback(() => {
    if (!marketAccount) return;
    setPenaltyAssets(totalPenalties);
    setPositionAssetsAmount(totalPositionAssets);
    setQty(formatUnits(totalPositionAssets + totalPenalties, marketAccount.decimals));

    if (walletBalance && parseUnits(walletBalance, marketAccount.decimals) < totalPositionAssets + totalPenalties)
      return setErrorData({ status: true, message: 'Insufficient balance', component: 'input' });

    setErrorData(undefined);
  }, [marketAccount, setErrorData, setQty, totalPenalties, totalPositionAssets, walletBalance]);

  const handleInputChange = useCallback(
    (value: string) => {
      if (!marketAccount) return;

      setQty(value);

      const input = parseUnits(value || '0', marketAccount.decimals);

      if (input === 0n || totalPositionAssets === 0n) {
        return setErrorData({ status: true, message: 'Cannot repay 0', component: 'input' });
      }

      const newPositionAssetsAmount =
        totalPositionAssets === 0n
          ? 0n
          : (input * ((totalPositionAssets * WAD) / (totalPositionAssets + totalPenalties))) / WAD;
      const newPenaltyAssets = input - newPositionAssetsAmount;
      setPenaltyAssets(newPenaltyAssets);
      setPositionAssetsAmount(newPositionAssetsAmount);

      if (
        walletBalance &&
        parseUnits(walletBalance, marketAccount.decimals) < newPenaltyAssets + newPositionAssetsAmount
      ) {
        return setErrorData({ status: true, message: 'Insufficient balance', component: 'input' });
      }

      setErrorData(undefined);
    },
    [marketAccount, setErrorData, setQty, totalPenalties, totalPositionAssets, walletBalance],
  );

  const repay = useCallback(async () => {
    if (!walletAddress || !marketAccount || !date || positionAssetsAmount === 0n || maxAmountToRepay === 0n) return;
    setIsLoadingOp(true);
    setCallId(undefined);
    try {
      let id: string;
      if (marketAccount.assetSymbol === 'WETH') {
        if (!marketEthRouter) return;
        if (ethRepaySimulation.error) throw ethRepaySimulation.error;
        ({ id } = await sendCalls({
          chainId: defaultChain.id,
          experimental_fallback: true,
          calls: [
            {
              to: marketEthRouter,
              abi: marketEthRouterAbi,
              functionName: 'repayAtMaturity',
              args: [date, positionAssetsAmount],
              value: maxAmountToRepay,
            },
          ],
        }));
      } else {
        if (requiresBatchedApproval && approveSimulation.error) throw approveSimulation.error;
        if (!requiresBatchedApproval && repaySimulation.error) throw repaySimulation.error;
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
                    args: [marketAccount.market, maxAmountToRepay],
                  } as const,
                ]
              : []),
            {
              to: marketAccount.market,
              abi: marketAbi,
              functionName: 'repayAtMaturity',
              args: [date, positionAssetsAmount, maxAmountToRepay, walletAddress],
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
    approveSimulation.error,
    date,
    ethRepaySimulation.error,
    handleOperationError,
    marketAccount,
    marketEthRouter,
    maxAmountToRepay,
    needsBatchedApproval,
    positionAssetsAmount,
    repaySimulation.error,
    requiresBatchedApproval,
    sendCalls,
    setErrorData,
    setIsLoadingOp,
    walletAddress,
  ]);

  const handleSubmitAction = useCallback(async () => {
    if (isLoading) return;
    return repay();
  }, [isLoading, repay]);

  if (txStatus) return <ModalGif status={txStatus} hash={txHash} tryAgain={repay} />;

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
              onChange={handleInputChange}
              label={t('Debt amount')}
              amount={formatUnits(totalPositionAssets, decimals)}
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
                value={formatNumber(formatUnits(totalPositionAssets, decimals), symbol, true)}
              />
            </ModalBoxCell>
            <ModalBoxCell>
              <ModalInfoAmount
                label={t('Max. amount to be paid')}
                value={formatNumber(formatUnits(maxAmountToRepay, decimals), symbol, true)}
                symbol={symbol}
              />
            </ModalBoxCell>
            {isLateRepay && (
              <>
                <ModalBoxCell>
                  <ModalInfoAmount
                    label={t('Penalties to be paid')}
                    value={formatNumber(formatUnits(penaltyAssets, decimals), symbol, true)}
                    symbol={symbol}
                  />
                </ModalBoxCell>
                <ModalBoxCell>
                  <ModalInfoAmount
                    label={t('Assets to be paid')}
                    value={formatNumber(formatUnits(positionAssetsAmount, decimals), symbol, true)}
                    symbol={symbol}
                  />
                </ModalBoxCell>
              </>
            )}
          </ModalBoxRow>
          <ModalBoxRow>
            <ModalBoxCell>
              <ModalInfoHealthFactor qty={qty} symbol={symbol} operation="repayAtMaturity" />
            </ModalBoxCell>
            {!isLateRepay && (
              <ModalBoxCell divisor>
                <ModalInfoBorrowLimit qty={qty} symbol={symbol} operation="repayAtMaturity" />
              </ModalBoxCell>
            )}
          </ModalBoxRow>
        </ModalBox>
      </Grid>

      <Grid item mt={2}>
        {!isLateRepay && previewData?.discount && (
          <ModalInfoRepayWithDiscount
            label={t('You are paying with discount')}
            symbol={symbol}
            isLoading={legacyRepayPreview.isLoading || repayPreview.isLoading}
            amountWithDiscount={previewData.amountWithDiscount}
            principal={previewData.principal}
            feeAtMaturity={previewData.feeAtMaturity}
            discount={previewData.discount}
          />
        )}
        <ModalAdvancedSettings>
          {isLateRepay && <ModalInfoBorrowLimit qty={qty} symbol={symbol} operation="repayAtMaturity" variant="row" />}
          <ModalInfoEditableSlippage value={rawSlippage} onChange={(e) => setRawSlippage(e.target.value)} />
          {!isLateRepay && (
            <ModalInfoFixedUtilizationRate qty={qty} symbol={symbol} operation="repayAtMaturity" variant="row" />
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
          label={translateOperation('repayAtMaturity', { capitalize: true })}
          symbol={symbol}
          submit={handleSubmitAction}
          isLoading={isLoading || isPreparing}
          disabled={!qty || parseFloat(qty) <= 0 || isLoading || isPreparing || errorData?.status}
          refreshOnSubmit={false}
        />
      </Grid>
    </Grid>
  );
};

export default React.memo(RepayAtMaturity);
