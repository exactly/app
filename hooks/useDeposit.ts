import { BigNumber, parseFixed } from '@ethersproject/bignumber';
import { WeiPerEther } from '@ethersproject/constants';
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

type Deposit = {
  deposit: () => void;
} & OperationHook;

export default (): Deposit => {
  const { t } = useTranslation();
  const { track } = useAnalytics();
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

      const gasPrice = (await ETHRouterContract.provider.getFeeData()).maxFeePerGas;
      if (!gasPrice) return;

      if (requiresApproval) {
        const gasEstimation = await approveEstimateGas();
        return gasEstimation?.mul(gasPrice);
      }

      if (marketAccount.assetSymbol === 'WETH') {
        const value = quantity ? parseFixed(quantity, 18) : defaultAmount;
        const gasLimit = await ETHRouterContract.estimateGas.deposit({ value });
        const gasCost = gasPrice.mul(gasLimit);
        if (value.add(gasCost).gte(parseFixed(walletBalance || '0', 18))) {
          throw new CustomError(t('Reserve ETH for gas fees.'), 'warning');
        }
        return gasCost;
      }

      const gasLimit = await marketContract.estimateGas.deposit(
        quantity ? parseFixed(quantity, marketAccount.decimals) : defaultAmount,
        walletAddress,
      );

      return gasPrice.mul(gasLimit);
    },
    [
      walletAddress,
      ETHRouterContract,
      marketContract,
      walletBalance,
      marketAccount,
      requiresApproval,
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

      setTx({ status: 'processing', hash: depositTx.hash });

      const { status, transactionHash } = await depositTx.wait();

      setTx({ status: status ? 'success' : 'error', hash: transactionHash });

      void track(status ? 'deposit' : 'depositRevert', {
        amount: qty,
        asset: marketAccount.assetSymbol,
        hash: transactionHash,
      });
    } catch (error) {
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
    setTx,
    track,
    qty,
    ETHRouterContract,
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

    void track('depositRequest', {
      amount: qty,
      asset: symbol,
    });

    return deposit();
  }, [isLoading, requiresApproval, track, qty, symbol, deposit, approve, setRequiresApproval, needsApproval]);

  return { isLoading, onMax, handleInputChange, handleSubmitAction, needsApproval, previewGasCost, deposit };
};
