import { BigNumber, parseFixed } from '@ethersproject/bignumber';
import { WeiPerEther, Zero } from '@ethersproject/constants';
import { useOperationContext } from 'contexts/OperationContext';
import useAccountData from 'hooks/useAccountData';
import useApprove from 'hooks/useApprove';
import useBalance from 'hooks/useBalance';
import useHandleOperationError from 'hooks/useHandleOperationError';
import { useWeb3 } from 'hooks/useWeb3';
import { useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { OperationHook } from 'types/OperationHook';
import useAnalytics from './useAnalytics';
import { defaultAmount, gasLimitMultiplier } from 'utils/const';
import { CustomError } from 'types/Error';
import useEstimateGas from './useEstimateGas';

type Deposit = {
  deposit: () => void;
} & OperationHook;

export default (): Deposit => {
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
    assetContract,
    ETHRouterContract,
    setErrorButton,
  } = useOperationContext();

  const handleOperationError = useHandleOperationError();

  const { marketAccount } = useAccountData(symbol);

  const walletBalance = useBalance(symbol, assetContract);

  const {
    approve,
    estimateGas: approveEstimateGas,
    isLoading: approveIsLoading,
    needsApproval,
  } = useApprove('deposit', assetContract, marketAccount?.market);

  const estimate = useEstimateGas();

  const previewGasCost = useCallback(
    async (quantity: string): Promise<BigNumber | undefined> => {
      if (
        !walletAddress ||
        !ETHRouterContract ||
        !marketContract ||
        !quantity ||
        (walletBalance && parseFloat(quantity) > parseFloat(walletBalance)) ||
        !marketAccount
      )
        return;

      if (await needsApproval(quantity)) {
        return approveEstimateGas();
      }

      if (marketAccount.assetSymbol === 'WETH') {
        const value = quantity ? parseFixed(quantity, 18) : defaultAmount;
        const populated = await ETHRouterContract.populateTransaction.deposit({ value });
        const gasCost = await estimate(populated);
        if (value.add(gasCost ?? Zero).gte(parseFixed(walletBalance || '0', 18))) {
          throw new CustomError(t('Reserve ETH for gas fees.'), 'warning');
        }
        return gasCost;
      }

      const populated = await marketContract.populateTransaction.deposit(
        quantity ? parseFixed(quantity, marketAccount.decimals) : defaultAmount,
        walletAddress,
      );
      return estimate(populated);
    },
    [
      walletAddress,
      ETHRouterContract,
      marketContract,
      walletBalance,
      marketAccount,
      needsApproval,
      estimate,
      approveEstimateGas,
      t,
    ],
  );

  const isLoading = useMemo(() => approveIsLoading || isLoadingOp, [approveIsLoading, isLoadingOp]);

  const onMax = useCallback(() => {
    if (walletBalance) {
      setQty(walletBalance);
      setErrorData(undefined);
    }
  }, [walletBalance, setQty, setErrorData]);

  const handleInputChange = useCallback(
    (value: string) => {
      setQty(value);

      if (walletBalance && parseFloat(value) > parseFloat(walletBalance)) {
        setErrorButton(t('Insufficient balance'));
        return;
      }
      setErrorButton(undefined);
      setErrorData(undefined);
    },
    [setQty, walletBalance, setErrorData, setErrorButton, t],
  );

  const deposit = useCallback(async () => {
    if (!walletAddress || !marketContract || !marketAccount) return;
    let depositTx;
    try {
      setIsLoadingOp(true);
      transaction.addToCart();

      if (marketAccount.assetSymbol === 'WETH') {
        if (!ETHRouterContract) return;

        const gasEstimation = await ETHRouterContract.estimateGas.deposit({ value: parseFixed(qty, 18) });

        depositTx = await ETHRouterContract.deposit({
          value: parseFixed(qty, 18),
          gasLimit: gasEstimation.mul(gasLimitMultiplier).div(WeiPerEther),
        });
      } else {
        const depositAmount = parseFixed(qty, marketAccount.decimals);
        const gasEstimation = await marketContract.estimateGas.deposit(depositAmount, walletAddress);

        depositTx = await marketContract.deposit(depositAmount, walletAddress, {
          gasLimit: gasEstimation.mul(gasLimitMultiplier).div(WeiPerEther),
        });
      }

      transaction.beginCheckout();

      setTx({ status: 'processing', hash: depositTx.hash });

      const { status, transactionHash } = await depositTx.wait();

      setTx({ status: status ? 'success' : 'error', hash: transactionHash });

      if (status) transaction.purchase();
    } catch (error) {
      transaction.removeFromCart();

      if (depositTx) setTx({ status: 'error', hash: depositTx.hash });
      setErrorData({ status: true, message: handleOperationError(error) });
    } finally {
      setIsLoadingOp(false);
    }
  }, [
    walletAddress,
    marketContract,
    marketAccount,
    setIsLoadingOp,
    transaction,
    setTx,
    ETHRouterContract,
    qty,
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

    return deposit();
  }, [isLoading, requiresApproval, qty, deposit, approve, setRequiresApproval, needsApproval]);

  return { isLoading, onMax, handleInputChange, handleSubmitAction, needsApproval, previewGasCost, deposit };
};
