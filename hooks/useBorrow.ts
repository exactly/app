import { BigNumber, formatFixed, parseFixed } from '@ethersproject/bignumber';
import { WeiPerEther, Zero } from '@ethersproject/constants';
import numbers from 'config/numbers.json';
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

const DEFAULT_AMOUNT = BigNumber.from(numbers.defaultAmount);

type Borrow = {
  handleBasicInputChange: (value: string) => void;
  borrow: () => void;
  safeMaximumBorrow: string;
} & OperationHook;

export default (): Borrow => {
  const analytics = useAnalytics();
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

  const { marketAccount, accountData, refreshAccountData } = useAccountData(symbol);
  const handleOperationError = useHandleOperationError();

  const healthFactor = useHealthFactor();
  const {
    approve,
    estimateGas: approveEstimateGas,
    isLoading: approveIsLoading,
    needsApproval,
  } = useApprove('borrow', marketContract, ETHRouterContract?.address);

  const maxBorrowAssets: BigNumber = useMemo(
    () => (marketAccount ? getBeforeBorrowLimit(marketAccount, 'borrow') : Zero),
    [marketAccount],
  );

  const liquidity = useMemo(() => {
    return marketAccount?.floatingAvailableAssets;
  }, [marketAccount]);

  const hasCollateral = useMemo(() => {
    if (!accountData || !marketAccount) return false;

    return (
      // hasDepositedToFloatingPool
      marketAccount.floatingDepositAssets.gt(Zero) || accountData.some((aMarket) => aMarket.isCollateral)
    );
  }, [accountData, marketAccount]);

  const previewGasCost = useCallback(
    async (quantity: string): Promise<BigNumber | undefined> => {
      if (!marketAccount || !walletAddress || !marketContract || !ETHRouterContract || !quantity) return;

      const gasPrice = (await ETHRouterContract.provider.getFeeData()).maxFeePerGas;
      if (!gasPrice) return;

      if (requiresApproval) {
        const gasEstimation = await approveEstimateGas();
        return gasEstimation?.mul(gasPrice);
      }

      if (marketAccount.assetSymbol === 'WETH') {
        const gasEstimation = await ETHRouterContract.estimateGas.borrow(
          quantity ? parseFixed(quantity, 18) : DEFAULT_AMOUNT,
        );
        return gasPrice.mul(gasEstimation);
      }

      const gasEstimation = await marketContract.estimateGas.borrow(
        quantity ? parseFixed(quantity, marketAccount.decimals) : DEFAULT_AMOUNT,
        walletAddress,
        walletAddress,
      );
      return gasPrice.mul(gasEstimation);
    },
    [walletAddress, marketContract, ETHRouterContract, requiresApproval, approveEstimateGas, marketAccount],
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
          message:
            'In order to borrow you need to have a deposit in the Variable Rate Pool marked as collateral in your Dashboard',
        });

      if (liquidity.lt(parseFixed(value || '0', decimals))) {
        return setErrorData({
          status: true,
          message: 'There is not enough liquidity',
        });
      }

      if (
        maxBorrowAssets.lt(
          parseFixed(value || '0', decimals)
            .mul(usdPrice)
            .div(WeiPerEther),
        )
      ) {
        return setErrorData({
          status: true,
          message: `You can't borrow more than your borrow limit`,
        });
      }
      setErrorData(undefined);
    },
    [liquidity, marketAccount, setQty, hasCollateral, setErrorData, maxBorrowAssets],
  );

  const handleBasicInputChange = useCallback(
    (value: string) => {
      if (!marketAccount) return;

      const { usdPrice, decimals } = marketAccount;

      setQty(value);

      if (
        maxBorrowAssets.lt(
          parseFixed(value || '0', decimals)
            .mul(usdPrice)
            .div(WeiPerEther),
        )
      ) {
        return setErrorData({
          status: true,
          message: `You can't borrow more than your borrow limit`,
        });
      }
      setErrorData(undefined);
    },
    [marketAccount, setQty, maxBorrowAssets, setErrorData],
  );

  const borrow = useCallback(async () => {
    if (!marketAccount) return;

    setIsLoadingOp(true);
    let borrowTx;

    try {
      if (marketAccount.assetSymbol === 'WETH') {
        if (!ETHRouterContract) return;

        const amount = parseFixed(qty, 18);
        const gasEstimation = await ETHRouterContract.estimateGas.borrow(amount);
        borrowTx = await ETHRouterContract.borrow(amount, {
          gasLimit: gasEstimation.mul(parseFixed(String(numbers.gasLimitMultiplier), 18)).div(WeiPerEther),
        });
      } else {
        if (!marketContract || !walletAddress) return;

        const amount = parseFixed(qty, marketAccount.decimals);
        const gasEstimation = await marketContract.estimateGas.borrow(amount, walletAddress, walletAddress);
        borrowTx = await marketContract.borrow(amount, walletAddress, walletAddress, {
          gasLimit: gasEstimation.mul(parseFixed(String(numbers.gasLimitMultiplier), 18)).div(WeiPerEther),
        });
      }

      setTx({ status: 'processing', hash: borrowTx.hash });

      const { status, transactionHash } = await borrowTx.wait();

      setTx({ status: status ? 'success' : 'error', hash: transactionHash });

      void analytics.track(status ? 'borrow' : 'borrowRevert', {
        amount: qty,
        asset: marketAccount.assetSymbol,
        hash: transactionHash,
      });

      await refreshAccountData();
    } catch (error) {
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
    setTx,
    analytics,
    qty,
    refreshAccountData,
    ETHRouterContract,
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

    void analytics.track('borrowRequest', {
      amount: qty,
      asset: symbol,
    });

    return borrow();
  }, [analytics, approve, borrow, isLoading, needsApproval, qty, requiresApproval, setRequiresApproval, symbol]);

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
