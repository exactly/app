import { useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import waitForTransaction from 'utils/waitForTransaction';

import { useOperationContext } from 'contexts/OperationContext';
import useAccountData from 'hooks/useAccountData';
import useApprove from 'hooks/useApprove';
import useHandleOperationError from 'hooks/useHandleOperationError';
import { useWeb3 } from 'hooks/useWeb3';
import { OperationHook } from 'types/OperationHook';
import getBeforeBorrowLimit from 'utils/getBeforeBorrowLimit';
import useHealthFactor from './useHealthFactor';
import useAnalytics from './useAnalytics';
import { WEI_PER_ETHER } from 'utils/const';
import useEstimateGas from './useEstimateGas';
import { parseUnits, formatUnits } from 'viem';
import { gasLimit } from 'utils/gas';
import { track } from '../utils/segment';

type Borrow = {
  handleBasicInputChange: (value: string) => void;
  borrow: () => void;
  safeMaximumBorrow: string;
} & OperationHook;

export default (): Borrow => {
  const { t } = useTranslation();
  const { walletAddress, opts } = useWeb3();

  const {
    symbol,
    operation,
    setErrorData,
    qty,
    setQty,
    setTx,
    requiresApproval,
    setRequiresApproval,
    isLoading: isLoadingOp,
    setIsLoading: setIsLoadingOp,
    marketContract,
    ETHRouterContract,
  } = useOperationContext();

  const { transaction } = useAnalytics({
    operationInput: useMemo(() => ({ operation, symbol, qty }), [operation, symbol, qty]),
  });

  const { marketAccount, accountData } = useAccountData(symbol);
  const handleOperationError = useHandleOperationError();

  const healthFactor = useHealthFactor();
  const {
    approve,
    estimateGas: approveEstimateGas,
    isLoading: approveIsLoading,
    needsApproval,
  } = useApprove({ operation: 'borrow', contract: marketContract, spender: ETHRouterContract?.address });

  const borrowLimit: bigint = useMemo(
    () => (marketAccount ? getBeforeBorrowLimit(marketAccount, 'borrow') : 0n),
    [marketAccount],
  );

  const liquidity = useMemo(() => {
    return marketAccount?.floatingAvailableAssets;
  }, [marketAccount]);

  const hasCollateral = useMemo(() => {
    if (!accountData || !marketAccount) return false;

    return marketAccount.floatingDepositAssets > 0n || accountData.some((aMarket) => aMarket.isCollateral);
  }, [accountData, marketAccount]);

  const estimate = useEstimateGas();

  const previewGasCost = useCallback(
    async (quantity: string): Promise<bigint | undefined> => {
      if (!marketAccount || !walletAddress || !marketContract || !ETHRouterContract || !quantity || !opts) return;

      if (await needsApproval(quantity)) {
        return approveEstimateGas();
      }

      const amount = parseUnits(quantity, marketAccount.decimals);

      if (marketAccount.assetSymbol === 'WETH') {
        walletAddress;
        const sim = await ETHRouterContract.simulate.borrow([amount], opts);
        return estimate(sim.request);
      }

      const sim = await marketContract.simulate.borrow([amount, walletAddress, walletAddress], opts);
      return estimate(sim.request);
    },
    [
      marketAccount,
      walletAddress,
      marketContract,
      ETHRouterContract,
      opts,
      needsApproval,
      estimate,
      approveEstimateGas,
    ],
  );

  const isLoading = useMemo(() => isLoadingOp || approveIsLoading, [isLoadingOp, approveIsLoading]);

  const safeMaximumBorrow = useMemo((): string => {
    if (!marketAccount || !healthFactor) return '';

    const { adjustFactor, usdPrice, floatingDepositAssets, isCollateral, decimals } = marketAccount;

    let col = healthFactor.collateral;
    const hf = parseUnits('1.05', 18);

    const hasDepositedToFloatingPool = floatingDepositAssets > 0n;

    if (!isCollateral && hasDepositedToFloatingPool) {
      col = col + (floatingDepositAssets * adjustFactor) / WEI_PER_ETHER;
    }

    const debt = healthFactor.debt;

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
  }, [setQty, safeMaximumBorrow, setErrorData]);

  const handleInputChange = useCallback(
    (value: string) => {
      if (liquidity === undefined || !marketAccount) return;

      const { usdPrice, decimals } = marketAccount;

      setQty(value);

      if (!hasCollateral)
        return setErrorData({
          status: true,
          variant: 'warning',
          message: t(
            'In order to borrow you need to have a deposit in the Variable Rate Pool marked as collateral in your Dashboard',
          ),
        });

      if (liquidity < parseUnits(value || '0', decimals)) {
        return setErrorData({
          status: true,
          message: t('There is not enough liquidity'),
        });
      }

      if (borrowLimit < (parseUnits(value || '0', decimals) * usdPrice) / WEI_PER_ETHER) {
        return setErrorData({
          status: true,
          message: t("You can't borrow more than your borrow limit"),
        });
      }
      setErrorData(undefined);
    },
    [liquidity, marketAccount, setQty, hasCollateral, setErrorData, borrowLimit, t],
  );

  const handleBasicInputChange = useCallback(
    (value: string) => {
      if (!marketAccount) return;

      const { usdPrice, decimals } = marketAccount;

      setQty(value);

      if (borrowLimit < (parseUnits(value || '0', decimals) * usdPrice) / WEI_PER_ETHER) {
        return setErrorData({
          status: true,
          message: t("You can't borrow more than your borrow limit"),
        });
      }
      setErrorData(undefined);
    },
    [marketAccount, setQty, borrowLimit, setErrorData, t],
  );

  const borrow = useCallback(async () => {
    if (!marketAccount || !walletAddress || !opts) return;

    setIsLoadingOp(true);
    let hash;
    try {
      transaction.addToCart();
      const amount = parseUnits(qty, marketAccount.decimals);
      if (marketAccount.assetSymbol === 'WETH') {
        if (!ETHRouterContract) return;
        const args = [amount] as const;
        const gasEstimation = await ETHRouterContract.estimateGas.borrow(args, opts);
        hash = await ETHRouterContract.write.borrow(args, {
          ...opts,
          gasLimit: gasLimit(gasEstimation),
        });
        track('Wallet Signed TX', {
          contractName: 'ETHRouter',
          method: 'borrow',
          symbol,
          qty,
        });
      } else {
        if (!marketContract) return;
        const args = [amount, walletAddress, walletAddress] as const;
        const gasEstimation = await marketContract.estimateGas.borrow(args, {
          account: walletAddress,
        });
        hash = await marketContract.write.borrow(args, {
          ...opts,
          gasLimit: gasLimit(gasEstimation),
        });
        track('Wallet Signed TX', {
          contractName: 'Market',
          method: 'borrow',
          symbol,
          qty,
          hash,
        });
      }

      transaction.beginCheckout();
      setTx({ status: 'processing', hash });

      const { status, transactionHash } = await waitForTransaction({ hash });
      track('TX Completed', {
        symbol,
        qty,
        status,
        hash: transactionHash,
      });

      setTx({ status: status ? 'success' : 'error', hash: transactionHash });

      if (status) transaction.purchase();
    } catch (error: unknown) {
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
    marketAccount,
    walletAddress,
    opts,
    setIsLoadingOp,
    transaction,
    setTx,
    ETHRouterContract,
    qty,
    marketContract,
    symbol,
    setErrorData,
    handleOperationError,
  ]);

  const handleSubmitAction = useCallback(async () => {
    if (isLoading) return;
    if (requiresApproval) {
      await approve();
      setRequiresApproval(await needsApproval(qty));
      return;
    }

    return borrow();
  }, [approve, borrow, isLoading, needsApproval, qty, requiresApproval, setRequiresApproval]);

  return {
    isLoading,
    onMax,
    handleInputChange,
    handleBasicInputChange,
    handleSubmitAction,
    borrow,
    previewGasCost,
    needsApproval,
    safeMaximumBorrow,
  };
};
