import { useOperationContext } from 'contexts/OperationContext';
import useAccountData from 'hooks/useAccountData';
import useApprove from 'hooks/useApprove';
import useBalance from 'hooks/useBalance';
import useHandleOperationError from 'hooks/useHandleOperationError';
import { useWeb3 } from 'hooks/useWeb3';
import { useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { OperationHook } from 'types/OperationHook';
import { CustomError } from 'types/Error';
import useEstimateGas from './useEstimateGas';
import { formatUnits, parseUnits } from 'viem';
import waitForTransaction from 'utils/waitForTransaction';
import { gasLimit } from 'utils/gas';
import { track } from 'utils/segment';
import { WEI_PER_ETHER } from 'utils/const';

type Deposit = {
  deposit: () => void;
} & OperationHook;

export default (): Deposit => {
  const { t } = useTranslation();
  const { walletAddress, opts } = useWeb3();

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

  const walletBalance = useBalance(symbol, assetContract?.address);

  const {
    approve,
    estimateGas: approveEstimateGas,
    isLoading: approveIsLoading,
    needsApproval,
  } = useApprove({ operation: 'deposit', contract: assetContract, spender: marketAccount?.market });

  const estimate = useEstimateGas();

  const previewGasCost = useCallback(
    async (quantity: string): Promise<bigint | undefined> => {
      if (
        !walletAddress ||
        !ETHRouterContract ||
        !marketContract ||
        !quantity ||
        (walletBalance && parseFloat(quantity) > parseFloat(walletBalance)) ||
        !marketAccount ||
        !opts
      )
        return;

      if (await needsApproval(quantity)) {
        return approveEstimateGas();
      }

      const amount = parseUnits(quantity, marketAccount.decimals);

      if (marketAccount.assetSymbol === 'WETH') {
        const sim = await ETHRouterContract.simulate.deposit({ ...opts, value: amount });
        const gasCost = await estimate(sim.request);
        if (amount + (gasCost ?? 0n) >= parseUnits(walletBalance || '0', marketAccount.decimals)) {
          throw new CustomError(t('Reserve ETH for gas fees.'), 'warning');
        }
        return gasCost;
      }

      const sim = await marketContract.simulate.deposit([amount, walletAddress], opts);
      return estimate(sim.request);
    },
    [
      walletAddress,
      ETHRouterContract,
      marketContract,
      walletBalance,
      marketAccount,
      needsApproval,
      opts,
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
    if (!walletAddress || !marketContract || !marketAccount || !opts) return;
    let hash;
    setIsLoadingOp(true);
    try {
      const amount = parseUnits(qty, marketAccount.decimals);
      if (marketAccount.assetSymbol === 'WETH') {
        if (!ETHRouterContract) return;

        const gasEstimation = await ETHRouterContract.estimateGas.deposit({ ...opts, value: amount });

        hash = await ETHRouterContract.write.deposit({
          ...opts,
          value: amount,
          gasLimit: gasLimit(gasEstimation),
        });
        track('TX Signed', {
          contractName: 'ETHRouter',
          method: 'deposit',
          hash,
          symbol,
          amount: qty,
          usdAmount: formatUnits((amount * marketAccount.usdPrice) / WEI_PER_ETHER, marketAccount.decimals),
        });
      } else {
        const args = [amount, walletAddress] as const;
        const gasEstimation = await marketContract.estimateGas.deposit(args, opts);

        hash = await marketContract.write.deposit(args, {
          ...opts,
          gasLimit: gasLimit(gasEstimation),
        });
        track('TX Signed', {
          contractName: 'Market',
          method: 'deposit',
          symbol,
          amount: qty,
          usdAmount: formatUnits((amount * marketAccount.usdPrice) / WEI_PER_ETHER, marketAccount.decimals),
          hash,
        });
      }

      setTx({ status: 'processing', hash });

      const { status, transactionHash } = await waitForTransaction({ hash });
      track('TX Completed', {
        symbol,
        amount: qty,
        usdAmount: formatUnits((amount * marketAccount.usdPrice) / WEI_PER_ETHER, marketAccount.decimals),
        status,
        hash: transactionHash,
      });

      setTx({ status: status ? 'success' : 'error', hash: transactionHash });
    } catch (error) {
      if (hash) setTx({ status: 'error', hash });
      setErrorData({ status: true, message: handleOperationError(error) });
    } finally {
      setIsLoadingOp(false);
    }
  }, [
    walletAddress,
    marketContract,
    marketAccount,
    opts,
    setIsLoadingOp,
    qty,
    setTx,
    ETHRouterContract,
    setErrorData,
    handleOperationError,
    symbol,
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
