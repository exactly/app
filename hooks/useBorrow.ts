import { BigNumber, formatFixed, parseFixed } from '@ethersproject/bignumber';
import { WeiPerEther, Zero } from '@ethersproject/constants';
import { useTranslation } from 'react-i18next';

import { useOperationContext } from 'contexts/OperationContext';
import useAccountData from 'hooks/useAccountData';
import useApprove from 'hooks/useApprove';
import useHandleOperationError from 'hooks/useHandleOperationError';
import { useWeb3 } from 'hooks/useWeb3';
import { useCallback, useMemo } from 'react';
import { OperationHook } from 'types/OperationHook';
import getBeforeBorrowLimit from 'utils/getBeforeBorrowLimit';
import useHealthFactor from './useHealthFactor';
import useAnalytics from './useAnalytics';
import { defaultAmount, gasLimitMultiplier } from 'utils/const';
import useEstimateGas from './useEstimateGas';

type Borrow = {
  handleBasicInputChange: (value: string) => void;
  borrow: () => void;
  safeMaximumBorrow: string;
} & OperationHook;

export default (): Borrow => {
  const { t } = useTranslation();
  const { transaction } = useAnalytics();
  const { walletAddress } = useWeb3();

  const {
    symbol,
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

  const { marketAccount, accountData } = useAccountData(symbol);
  const handleOperationError = useHandleOperationError();

  const healthFactor = useHealthFactor();
  const {
    approve,
    estimateGas: approveEstimateGas,
    isLoading: approveIsLoading,
    needsApproval,
  } = useApprove('borrow', marketContract, ETHRouterContract?.address);

  const borrowLimit: BigNumber = useMemo(
    () => (marketAccount ? getBeforeBorrowLimit(marketAccount, 'borrow') : Zero),
    [marketAccount],
  );

  const liquidity = useMemo(() => {
    return marketAccount?.floatingAvailableAssets;
  }, [marketAccount]);

  const hasCollateral = useMemo(() => {
    if (!accountData || !marketAccount) return false;

    return marketAccount.floatingDepositAssets.gt(Zero) || accountData.some((aMarket) => aMarket.isCollateral);
  }, [accountData, marketAccount]);

  const estimate = useEstimateGas();

  const previewGasCost = useCallback(
    async (quantity: string): Promise<BigNumber | undefined> => {
      if (!marketAccount || !walletAddress || !marketContract || !ETHRouterContract || !quantity) return;

      if (await needsApproval(quantity)) {
        return approveEstimateGas();
      }

      if (marketAccount.assetSymbol === 'WETH') {
        const populated = await ETHRouterContract.populateTransaction.borrow(
          quantity ? parseFixed(quantity, 18) : defaultAmount,
        );
        return estimate(populated);
      }

      const populated = await marketContract.populateTransaction.borrow(
        quantity ? parseFixed(quantity, marketAccount.decimals) : defaultAmount,
        walletAddress,
        walletAddress,
      );
      return estimate(populated);
    },
    [marketAccount, walletAddress, marketContract, ETHRouterContract, needsApproval, estimate, approveEstimateGas],
  );

  const isLoading = useMemo(() => isLoadingOp || approveIsLoading, [isLoadingOp, approveIsLoading]);

  const safeMaximumBorrow = useMemo((): string => {
    if (!marketAccount || !healthFactor) return '';

    const { adjustFactor, usdPrice, floatingDepositAssets, isCollateral, decimals } = marketAccount;

    let col = healthFactor.collateral;
    const hf = parseFixed('1.05', 18);

    const hasDepositedToFloatingPool = Number(formatFixed(floatingDepositAssets, decimals)) > 0;

    if (!isCollateral && hasDepositedToFloatingPool) {
      col = col.add(floatingDepositAssets.mul(adjustFactor).div(WeiPerEther));
    }

    const debt = healthFactor.debt;

    return Math.max(
      0,
      Number(
        formatFixed(
          col
            .sub(hf.mul(debt).div(WeiPerEther))
            .mul(WeiPerEther)
            .div(hf)
            .mul(WeiPerEther)
            .div(usdPrice)
            .mul(adjustFactor)
            .div(WeiPerEther),
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
      if (!liquidity || !marketAccount) return;

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

      if (liquidity.lt(parseFixed(value || '0', decimals))) {
        return setErrorData({
          status: true,
          message: t('There is not enough liquidity'),
        });
      }

      if (
        borrowLimit.lt(
          parseFixed(value || '0', decimals)
            .mul(usdPrice)
            .div(WeiPerEther),
        )
      ) {
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

      if (
        borrowLimit.lt(
          parseFixed(value || '0', decimals)
            .mul(usdPrice)
            .div(WeiPerEther),
        )
      ) {
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
    if (!marketAccount) return;

    setIsLoadingOp(true);
    let borrowTx;
    try {
      transaction.addToCart();
      if (marketAccount.assetSymbol === 'WETH') {
        if (!ETHRouterContract) return;

        const amount = parseFixed(qty, 18);
        const gasEstimation = await ETHRouterContract.estimateGas.borrow(amount);
        borrowTx = await ETHRouterContract.borrow(amount, {
          gasLimit: gasEstimation.mul(gasLimitMultiplier).div(WeiPerEther),
        });
      } else {
        if (!marketContract || !walletAddress) return;

        const amount = parseFixed(qty, marketAccount.decimals);
        const gasEstimation = await marketContract.estimateGas.borrow(amount, walletAddress, walletAddress);
        borrowTx = await marketContract.borrow(amount, walletAddress, walletAddress, {
          gasLimit: gasEstimation.mul(gasLimitMultiplier).div(WeiPerEther),
        });
      }

      transaction.beginCheckout();

      setTx({ status: 'processing', hash: borrowTx.hash });

      const { status, transactionHash } = await borrowTx.wait();

      setTx({ status: status ? 'success' : 'error', hash: transactionHash });

      if (status) transaction.purchase();
    } catch (error) {
      transaction.removeFromCart();
      if (borrowTx?.hash) setTx({ status: 'error', hash: borrowTx.hash });

      setErrorData({
        status: true,
        message: handleOperationError(error),
      });
    } finally {
      setIsLoadingOp(false);
    }
  }, [
    marketAccount,
    setIsLoadingOp,
    transaction,
    setTx,
    ETHRouterContract,
    qty,
    marketContract,
    walletAddress,
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
