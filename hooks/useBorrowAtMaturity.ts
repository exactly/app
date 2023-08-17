import { useCallback, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useOperationContext } from 'contexts/OperationContext';
import useAccountData from 'hooks/useAccountData';
import useApprove from 'hooks/useApprove';
import useHandleOperationError from 'hooks/useHandleOperationError';
import usePoolLiquidity from 'hooks/usePoolLiquidity';
import usePreviewer from 'hooks/usePreviewer';
import { useWeb3 } from 'hooks/useWeb3';
import { OperationHook } from 'types/OperationHook';
import getBeforeBorrowLimit from 'utils/getBeforeBorrowLimit';
import useHealthFactor from './useHealthFactor';
import useAnalytics from './useAnalytics';
import { WEI_PER_ETHER } from 'utils/const';
import useEstimateGas from './useEstimateGas';
import { formatUnits, parseUnits } from 'viem';
import { waitForTransaction } from '@wagmi/core';
import dayjs from 'dayjs';
import { gasLimit } from 'utils/gas';

type BorrowAtMaturity = {
  borrow: () => void;
  updateAPR: () => void;
  rawSlippage: string;
  setRawSlippage: (value: string) => void;
  fixedRate: bigint | undefined;
  hasCollateral: boolean;
  safeMaximumBorrow: string;
} & OperationHook;

export default (): BorrowAtMaturity => {
  const { t } = useTranslation();
  const { walletAddress, opts } = useWeb3();

  const {
    symbol,
    operation,
    setErrorData,
    qty,
    setQty,
    setTx,
    date,
    requiresApproval,
    setRequiresApproval,
    isLoading: isLoadingOp,
    setIsLoading: setIsLoadingOp,
    marketContract,
    ETHRouterContract,
    rawSlippage,
    setRawSlippage,
    slippage,
  } = useOperationContext();

  const { transaction } = useAnalytics({
    operationInput: useMemo(() => ({ operation, symbol, qty }), [operation, symbol, qty]),
  });

  const handleOperationError = useHandleOperationError();

  const { accountData, marketAccount } = useAccountData(symbol);

  const [fixedRate, setFixedRate] = useState<bigint | undefined>();

  const healthFactor = useHealthFactor();
  const minBorrowRate = useMemo<bigint | undefined>(() => {
    if (!marketAccount) return;

    const { fixedPools = [] } = marketAccount;
    const pool = fixedPools.find(({ maturity }) => maturity === date);
    return pool?.minBorrowRate;
  }, [marketAccount, date]);

  const previewerContract = usePreviewer();

  const {
    approve,
    estimateGas: approveEstimateGas,
    isLoading: approveIsLoading,
    needsApproval,
  } = useApprove({ operation: 'borrowAtMaturity', contract: marketContract, spender: ETHRouterContract?.address });

  const poolLiquidity = usePoolLiquidity(symbol);

  const hasCollateral = useMemo(() => {
    if (!accountData || !marketAccount) return false;

    return marketAccount.floatingDepositAssets > 0n || accountData.some((aMarket) => aMarket.isCollateral);
  }, [accountData, marketAccount]);

  const estimate = useEstimateGas();

  const previewGasCost = useCallback(
    async (quantity: string): Promise<bigint | undefined> => {
      if (!marketAccount || !walletAddress || !marketContract || !ETHRouterContract || !date || !quantity || !opts)
        return;

      if (await needsApproval(quantity)) {
        return approveEstimateGas();
      }

      const amount = parseUnits(quantity, marketAccount.decimals);
      const maxAmount = (amount * slippage) / WEI_PER_ETHER;
      if (marketAccount.assetSymbol === 'WETH') {
        const sim = await ETHRouterContract.simulate.borrowAtMaturity([date, amount, maxAmount], opts);
        return estimate(sim.request);
      }

      const sim = await marketContract.simulate.borrowAtMaturity(
        [date, amount, maxAmount, walletAddress, walletAddress],
        opts,
      );
      return estimate(sim.request);
    },
    [
      marketAccount,
      walletAddress,
      marketContract,
      ETHRouterContract,
      date,
      opts,
      needsApproval,
      slippage,
      estimate,
      approveEstimateGas,
    ],
  );

  const isLoading = useMemo(() => isLoadingOp || approveIsLoading, [isLoadingOp, approveIsLoading]);

  const safeMaximumBorrow = useMemo((): string => {
    if (!marketAccount || !healthFactor) return '';

    const { usdPrice, adjustFactor, floatingDepositAssets, isCollateral, decimals } = marketAccount;

    let col = healthFactor.collateral;
    const hf = parseUnits('1.05', 18);

    const hasDepositedToFloatingPool = floatingDepositAssets > 0n;

    if (!isCollateral && hasDepositedToFloatingPool) {
      col = col + (floatingDepositAssets * adjustFactor) / WEI_PER_ETHER;
    }

    const { debt } = healthFactor;

    return Math.max(
      0,
      Number(
        formatUnits(
          ((((((col - (hf * debt) / WEI_PER_ETHER) * WEI_PER_ETHER) / hf) * WEI_PER_ETHER) / usdPrice) * adjustFactor) /
            WEI_PER_ETHER,
          18,
        ),
      ),
    ).toFixed(decimals);
  }, [marketAccount, healthFactor]);

  const onMax = useCallback(() => {
    setQty(safeMaximumBorrow);
    setErrorData(undefined);
  }, [safeMaximumBorrow, setErrorData, setQty]);

  const handleInputChange = useCallback(
    (value: string) => {
      if (!marketAccount) return;
      const { usdPrice, decimals } = marketAccount;

      setQty(value);

      if (poolLiquidity && poolLiquidity < parseFloat(value)) {
        return setErrorData({
          status: true,
          message: t('There is not enough liquidity in this pool'),
        });
      }

      const borrowLimit = getBeforeBorrowLimit(marketAccount, 'borrow');

      if (borrowLimit < (parseUnits(value || '0', decimals) * usdPrice) / WEI_PER_ETHER) {
        return setErrorData({
          status: true,
          message: t("You can't borrow more than your borrow limit"),
        });
      }
      setErrorData(undefined);
    },
    [marketAccount, setQty, poolLiquidity, setErrorData, t],
  );

  const borrow = useCallback(async () => {
    setIsLoadingOp(true);

    if (fixedRate && slippage < fixedRate) {
      setIsLoadingOp(false);

      return setErrorData({
        status: true,
        message: t('The transaction failed, please check your Maximum Deposit Rate'),
      });
    }

    if (!marketAccount || !date || !qty || !walletAddress || !opts) return;

    const amount = parseUnits(qty, marketAccount.decimals);
    const maxAmount = (amount * slippage) / WEI_PER_ETHER;

    let hash;
    try {
      transaction.addToCart();
      if (marketAccount.assetSymbol === 'WETH') {
        if (!ETHRouterContract) return;

        const args = [date, amount, maxAmount] as const;

        const gasEstimation = await ETHRouterContract.estimateGas.borrowAtMaturity(args, opts);

        hash = await ETHRouterContract.write.borrowAtMaturity(args, {
          ...opts,
          gasLimit: gasLimit(gasEstimation),
        });
      } else {
        if (!marketContract) return;

        const args = [date, amount, maxAmount, walletAddress, walletAddress] as const;

        const gasEstimation = await marketContract.estimateGas.borrowAtMaturity(args, opts);

        hash = await marketContract.write.borrowAtMaturity(args, {
          ...opts,
          gasLimit: gasLimit(gasEstimation),
        });
      }

      transaction.beginCheckout();
      setTx({ status: 'processing', hash });

      const { status, transactionHash } = await waitForTransaction({ hash });
      setTx({ status: status ? 'success' : 'error', hash: transactionHash });

      if (status) transaction.purchase();
    } catch (error) {
      transaction.removeFromCart();
      if (hash) setTx({ status: 'error', hash });

      setErrorData({
        status: true,
        message: handleOperationError(error),
      });
    } finally {
      setIsLoadingOp(false);
    }
  }, [
    setIsLoadingOp,
    fixedRate,
    slippage,
    marketAccount,
    date,
    qty,
    walletAddress,
    opts,
    setErrorData,
    t,
    transaction,
    setTx,
    ETHRouterContract,
    marketContract,
    handleOperationError,
  ]);

  const updateAPR = useCallback(async () => {
    if (!marketAccount || !date || !previewerContract || !minBorrowRate) {
      setFixedRate(undefined);
      return;
    }

    if (qty) {
      const initialAssets = parseUnits(qty, marketAccount.decimals);
      try {
        const { assets: finalAssets } = await previewerContract.read.previewBorrowAtMaturity([
          marketAccount.market,
          date,
          initialAssets,
        ]);
        const currentTimestamp = BigInt(dayjs().unix());
        const rate = (finalAssets * WEI_PER_ETHER) / initialAssets;
        const fixedAPR = ((rate - WEI_PER_ETHER) * 31_536_000n) / (date - currentTimestamp);

        setFixedRate(fixedAPR);
      } catch (error) {
        setFixedRate(undefined);
      }
    } else {
      setFixedRate(minBorrowRate);
    }
  }, [marketAccount, date, previewerContract, minBorrowRate, qty]);

  const handleSubmitAction = useCallback(async () => {
    if (isLoading) return;
    if (requiresApproval) {
      await approve();
      setRequiresApproval(await needsApproval(qty));
      return;
    }

    return borrow();
  }, [isLoading, requiresApproval, qty, borrow, approve, setRequiresApproval, needsApproval]);

  return {
    isLoading,
    onMax,
    handleInputChange,
    handleSubmitAction,
    borrow,
    updateAPR,
    rawSlippage,
    setRawSlippage,
    fixedRate,
    hasCollateral,
    previewGasCost,
    needsApproval,
    safeMaximumBorrow,
  };
};
