import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { WAD } from '@exactly/lib';

import { useOperationContext } from 'contexts/OperationContext';
import {
  legacyPreviewerAddress,
  marketAbi,
  marketEthRouterAbi,
  marketEthRouterAddress,
  previewerAddress,
  useReadLegacyPreviewerPreviewBorrowAtMaturity,
  useReadMarketAllowance,
  useReadPreviewerPreviewBorrowAtMaturity,
  useSimulateMarketApprove,
  useSimulateMarketBorrowAtMaturity,
  useSimulateMarketEthRouterBorrowAtMaturity,
} from 'generated/wagmi';
import useAccountData from 'hooks/useAccountData';
import useHandleOperationError from 'hooks/useHandleOperationError';
import usePoolLiquidity from 'hooks/usePoolLiquidity';
import getBeforeBorrowLimit from 'utils/getBeforeBorrowLimit';
import useHealthFactor from './useHealthFactor';
import { formatUnits, parseUnits, type Hex } from 'viem';
import dayjs from 'dayjs';
import { track } from 'utils/mixpanel';
import { defaultChain } from 'utils/client';
import useReadOnly from 'hooks/useReadOnly';
import { useSendCalls, useWaitForCallsStatus } from 'wagmi';

type BorrowAtMaturity = {
  borrow: () => Promise<void>;
  handleSubmitAction: () => Promise<void>;
  handleInputChange: (value: string) => void;
  updateAPR: () => void;
  isPreparing: boolean;
  isLoading: boolean;
  onMax: () => void;
  rawSlippage: string;
  setRawSlippage: (value: string) => void;
  fixedRate: bigint | undefined;
  hasCollateral: boolean;
  safeMaximumBorrow: string;
  txStatus?: 'loading' | 'processing' | 'success' | 'error';
  txHash?: Hex;
};

const legacyPreviewerChainId = Object.keys(legacyPreviewerAddress)
  .map(Number)
  .find((chainId): chainId is keyof typeof legacyPreviewerAddress => chainId === defaultChain.id);
const previewerChainId = Object.keys(previewerAddress)
  .map(Number)
  .find((chainId): chainId is keyof typeof previewerAddress => chainId === defaultChain.id);

export default (): BorrowAtMaturity => {
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
    receiver,
  } = useOperationContext();

  const handleOperationError = useHandleOperationError();
  const { accountData, marketAccount, refreshAccountData } = useAccountData(symbol);
  const healthFactor = useHealthFactor();
  const poolLiquidity = usePoolLiquidity(symbol);
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
  const minBorrowRate = useMemo<bigint | undefined>(() => {
    if (!marketAccount) return;

    return marketAccount.fixedPools.find(({ maturity }) => maturity === date)?.minBorrowRate;
  }, [marketAccount, date]);
  const legacyBorrowPreview = useReadLegacyPreviewerPreviewBorrowAtMaturity({
    chainId: legacyPreviewerChainId,
    args: marketAccount && date && amount !== undefined ? [marketAccount.market, date, amount] : undefined,
    query: {
      enabled: Boolean(
        legacyPreviewerChainId !== undefined && marketAccount && date && amount !== undefined && amount > 0n,
      ),
    },
  });
  const borrowPreview = useReadPreviewerPreviewBorrowAtMaturity({
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
    legacyPreviewerChainId !== undefined ? legacyBorrowPreview.data?.assets : borrowPreview.data?.assets;
  const fixedFee = amount !== undefined && finalAssets !== undefined ? finalAssets - amount : undefined;
  const fixedRate = useMemo(() => {
    if (!date || !minBorrowRate) return;
    if (!amount || !finalAssets) return minBorrowRate;
    const currentTimestamp = BigInt(dayjs().unix());
    return (((finalAssets * WAD) / amount - WAD) * 31_536_000n) / (date - currentTimestamp);
  }, [amount, date, finalAssets, minBorrowRate]);
  const maxAmount = amount !== undefined && fixedFee !== undefined ? ((amount + fixedFee) * slippage) / WAD : undefined;
  const { data: marketAllowance, refetch: refetchMarketAllowance } = useReadMarketAllowance({
    address: marketAccount?.market,
    args: walletAddress && marketEthRouter ? [walletAddress, marketEthRouter] : undefined,
    chainId: defaultChain.id,
    query: { enabled: Boolean(walletAddress && marketEthRouter && marketAccount?.assetSymbol === 'WETH') },
  });
  const hasCollateral = useMemo(() => {
    if (!accountData || !marketAccount) return false;

    return marketAccount.floatingDepositAssets > 0n || accountData.some((aMarket) => aMarket.isCollateral);
  }, [accountData, marketAccount]);
  const safeMaximumBorrow = useMemo((): string => {
    if (!marketAccount || !healthFactor) return '';

    const { usdPrice, adjustFactor, floatingDepositAssets, isCollateral, decimals } = marketAccount;
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
      date &&
      amount !== undefined &&
      maxAmount !== undefined &&
      parseFloat(qty) > 0 &&
      hasCollateral,
  );
  const requiresBatchedApproval = Boolean(
    inputReady &&
      marketAccount?.assetSymbol === 'WETH' &&
      marketAllowance !== undefined &&
      maxAmount !== undefined &&
      marketAllowance < maxAmount,
  );
  const approveSimulation = useSimulateMarketApprove({
    address: marketAccount?.market,
    args: marketEthRouter && maxAmount !== undefined ? [marketEthRouter, maxAmount] : undefined,
    account: walletAddress,
    chainId: defaultChain.id,
    query: { enabled: requiresBatchedApproval },
  });
  const borrowSimulation = useSimulateMarketBorrowAtMaturity({
    address: marketAccount?.market,
    args:
      date && amount !== undefined && maxAmount !== undefined && walletAddress
        ? [date, amount, maxAmount, receiver || walletAddress, walletAddress]
        : undefined,
    account: walletAddress,
    chainId: defaultChain.id,
    query: { enabled: Boolean(inputReady && marketAccount?.assetSymbol !== 'WETH') },
  });
  const ethBorrowSimulation = useSimulateMarketEthRouterBorrowAtMaturity({
    args: date && amount !== undefined && maxAmount !== undefined ? [date, amount, maxAmount] : undefined,
    account: walletAddress,
    chainId: marketEthRouterChainId,
    query: {
      enabled: Boolean(
        inputReady &&
          marketAccount?.assetSymbol === 'WETH' &&
          marketEthRouterChainId !== undefined &&
          marketAllowance !== undefined &&
          maxAmount !== undefined &&
          marketAllowance >= maxAmount,
      ),
    },
  });
  const callsStatus = useWaitForCallsStatus({
    id: callId,
    query: { enabled: Boolean(callId) },
  });
  const needsBatchedApproval = useCallback(async () => {
    if (marketAccount?.assetSymbol !== 'WETH' || !walletAddress || !marketEthRouter || maxAmount === undefined)
      return false;
    return (marketAllowance ?? (await refetchMarketAllowance()).data ?? 0n) < maxAmount;
  }, [marketAccount?.assetSymbol, marketAllowance, marketEthRouter, maxAmount, refetchMarketAllowance, walletAddress]);
  const isLoading = useMemo(() => sendCallsPending || isLoadingOp, [sendCallsPending, isLoadingOp]);
  const isPreparing = useMemo(
    () =>
      approveSimulation.isLoading ||
      borrowSimulation.isLoading ||
      ethBorrowSimulation.isLoading ||
      legacyBorrowPreview.isLoading ||
      borrowPreview.isLoading,
    [
      approveSimulation.isLoading,
      borrowPreview.isLoading,
      borrowSimulation.isLoading,
      ethBorrowSimulation.isLoading,
      legacyBorrowPreview.isLoading,
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
    void refreshAccountData();
    if (marketAccount?.assetSymbol === 'WETH') void refetchMarketAllowance();
  }, [callsStatus.data?.receipts, marketAccount?.assetSymbol, refetchMarketAllowance, refreshAccountData]);

  useEffect(() => {
    if (!callsStatus.data || !marketAccount || !txHash) return;
    if (callsStatus.data.status !== 'success' && callsStatus.data.status !== 'failure') return;
    track('TX Completed', {
      contractName: marketAccount.assetSymbol === 'WETH' ? 'ETHRouter' : 'Market',
      method: 'borrowAtMaturity',
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
  }, [safeMaximumBorrow, setErrorData, setQty]);

  const handleInputChange = useCallback(
    (value: string) => {
      if (!marketAccount) return;

      setQty(value);

      if (poolLiquidity && poolLiquidity < parseFloat(value)) {
        return setErrorData({ status: true, message: t('There is not enough liquidity in this pool') });
      }

      if (
        getBeforeBorrowLimit(marketAccount, 'borrow') <
        (parseUnits(value || '0', marketAccount.decimals) * marketAccount.usdPrice) / WAD
      ) {
        return setErrorData({ status: true, message: t("You can't borrow more than your borrow limit") });
      }
      setErrorData(undefined);
    },
    [marketAccount, poolLiquidity, setErrorData, setQty, t],
  );

  const borrow = useCallback(async () => {
    if (fixedRate && slippage < fixedRate) {
      setErrorData({ status: true, message: t('The transaction failed, please check your Maximum Deposit Rate') });
      return;
    }
    if (!walletAddress || !marketAccount || !date || amount === undefined || maxAmount === undefined) return;
    setIsLoadingOp(true);
    setCallId(undefined);
    try {
      let id: string;
      if (marketAccount.assetSymbol === 'WETH') {
        if (!marketEthRouter) return;
        if (requiresBatchedApproval && approveSimulation.error) throw approveSimulation.error;
        if (!requiresBatchedApproval && ethBorrowSimulation.error) throw ethBorrowSimulation.error;
        ({ id } = await sendCalls({
          account: walletAddress,
          chainId: defaultChain.id,
          experimental_fallback: true,
          calls: [
            ...((await needsBatchedApproval())
              ? [
                  {
                    to: marketAccount.market,
                    abi: marketAbi,
                    functionName: 'approve',
                    args: [marketEthRouter, maxAmount],
                  } as const,
                ]
              : []),
            {
              to: marketEthRouter,
              abi: marketEthRouterAbi,
              functionName: 'borrowAtMaturity',
              args: [date, amount, maxAmount],
            },
          ],
        }));
      } else {
        if (borrowSimulation.error) throw borrowSimulation.error;
        ({ id } = await sendCalls({
          account: walletAddress,
          chainId: defaultChain.id,
          experimental_fallback: true,
          calls: [
            {
              to: marketAccount.market,
              abi: marketAbi,
              functionName: 'borrowAtMaturity',
              args: [date, amount, maxAmount, receiver || walletAddress, walletAddress],
            },
          ],
        }));
      }
      setCallId(id);
      track('TX Signed', {
        contractName: marketAccount.assetSymbol === 'WETH' ? 'ETHRouter' : 'Market',
        method: 'borrowAtMaturity',
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
    borrowSimulation.error,
    date,
    ethBorrowSimulation.error,
    fixedRate,
    handleOperationError,
    marketAccount,
    marketEthRouter,
    maxAmount,
    needsBatchedApproval,
    qty,
    receiver,
    requiresBatchedApproval,
    sendCalls,
    setErrorData,
    setIsLoadingOp,
    slippage,
    symbol,
    t,
    walletAddress,
  ]);

  const handleSubmitAction = useCallback(async () => {
    if (isLoading) return;
    return borrow();
  }, [borrow, isLoading]);

  const updateAPR = useCallback(() => {
    if (legacyPreviewerChainId !== undefined) void legacyBorrowPreview.refetch();
    else void borrowPreview.refetch();
  }, [borrowPreview, legacyBorrowPreview]);

  return {
    isLoading,
    isPreparing,
    onMax,
    handleInputChange,
    handleSubmitAction,
    borrow,
    updateAPR,
    rawSlippage,
    setRawSlippage,
    fixedRate,
    hasCollateral,
    safeMaximumBorrow,
    txStatus,
    txHash,
  };
};
