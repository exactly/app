import { BigNumber, formatFixed, parseFixed } from '@ethersproject/bignumber';
import { WeiPerEther } from '@ethersproject/constants';
import numbers from 'config/numbers.json';
import { useOperationContext } from 'contexts/OperationContext';
import useAccountData from 'hooks/useAccountData';
import useApprove from 'hooks/useApprove';
import useBalance from 'hooks/useBalance';
import useHandleOperationError from 'hooks/useHandleOperationError';
import { useWeb3 } from 'hooks/useWeb3';
import { useCallback, useMemo } from 'react';
import { OperationHook } from 'types/OperationHook';
import analytics from 'utils/analytics';

const DEFAULT_AMOUNT = BigNumber.from(numbers.defaultAmount);

type Deposit = {
  deposit: () => void;
} & OperationHook;

export default (): Deposit => {
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

  const { marketAccount, refreshAccountData } = useAccountData(symbol);

  const walletBalance = useBalance(symbol, assetContract);

  const {
    approve,
    estimateGas: approveEstimateGas,
    isLoading: approveIsLoading,
    needsApproval,
  } = useApprove('deposit', assetContract, marketContract?.address);

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
        const gasLimit = await ETHRouterContract.estimateGas.deposit({
          value: quantity ? parseFixed(quantity, 18) : DEFAULT_AMOUNT,
        });

        return gasPrice.mul(gasLimit);
      }

      const gasLimit = await marketContract.estimateGas.deposit(
        quantity ? parseFixed(quantity, marketAccount.decimals) : DEFAULT_AMOUNT,
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
        setErrorButton('Insufficient balance');
        return;
      }
      setErrorButton(undefined);
      setErrorData(undefined);
    },
    [setQty, walletBalance, setErrorData, setErrorButton],
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
          gasLimit: gasEstimation.mul(parseFixed(String(numbers.gasLimitMultiplier), 18)).div(WeiPerEther),
        });
      } else {
        const depositAmount = parseFixed(qty, marketAccount.decimals);
        const gasEstimation = await marketContract.estimateGas.deposit(depositAmount, walletAddress);

        depositTx = await marketContract.deposit(depositAmount, walletAddress, {
          gasLimit: Math.ceil(Number(formatFixed(gasEstimation)) * numbers.gasLimitMultiplier),
        });
      }

      setTx({ status: 'processing', hash: depositTx.hash });

      const { status, transactionHash } = await depositTx.wait();

      setTx({ status: status ? 'success' : 'error', hash: transactionHash });

      void analytics.track(status ? 'deposit' : 'depositRevert', {
        amount: qty,
        asset: marketAccount.assetSymbol,
        hash: transactionHash,
      });

      await refreshAccountData();
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
    qty,
    refreshAccountData,
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

    void analytics.track('depositRequest', {
      amount: qty,
      asset: symbol,
    });

    return deposit();
  }, [isLoading, requiresApproval, qty, symbol, deposit, approve, setRequiresApproval, needsApproval]);

  return { isLoading, onMax, handleInputChange, handleSubmitAction, needsApproval, previewGasCost, deposit };
};
