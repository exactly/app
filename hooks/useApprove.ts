import { useCallback, useState } from 'react';
import { parseUnits, type Address, type EstimateGasParameters, type Hex } from 'viem';
import { ERC20, Market } from 'types/contracts';
import { useWeb3 } from './useWeb3';
import { useOperationContext } from 'contexts/OperationContext';
import useAccountData from './useAccountData';
import handleOperationError from 'utils/handleOperationError';
import { waitForTransaction } from '@wagmi/core';
import { useTranslation } from 'react-i18next';

import { MAX_UINT256 } from 'utils/const';
import useEstimateGas from './useEstimateGas';
import useAnalytics from './useAnalytics';
import { gasLimit } from 'utils/gas';

function useApprove({
  operation,
  contract,
  spender,
}:
  | { operation: 'deposit' | 'depositAtMaturity' | 'repay' | 'repayAtMaturity'; contract?: ERC20; spender?: Address }
  | {
      operation: 'withdraw' | 'withdrawAtMaturity' | 'borrow' | 'borrowAtMaturity';
      contract?: Market;
      spender?: Address;
    }) {
  const { t } = useTranslation();
  const { walletAddress, opts } = useWeb3();
  const { qty, symbol, setErrorData, setLoadingButton } = useOperationContext();
  const [isLoading, setIsLoading] = useState(false);
  const { transaction } = useAnalytics();

  const { marketAccount } = useAccountData(symbol);

  const estimate = useEstimateGas();

  const estimateGas = useCallback(async () => {
    if (!contract || !spender || !walletAddress || !opts) return;

    let params: EstimateGasParameters;
    switch (operation) {
      case 'deposit':
      case 'depositAtMaturity':
      case 'repay':
      case 'repayAtMaturity': {
        const { request } = await contract.simulate.approve([spender, MAX_UINT256], opts);
        params = request;
        break;
      }
      case 'withdraw':
      case 'withdrawAtMaturity':
      case 'borrow':
      case 'borrowAtMaturity': {
        const { request } = await contract.simulate.approve([spender, MAX_UINT256], opts);
        params = request;
        break;
      }
    }

    if (!params) return;

    return estimate(params);
  }, [contract, spender, walletAddress, opts, operation, estimate]);

  const needsApproval = useCallback(
    async (amount: string): Promise<boolean> => {
      try {
        if (!walletAddress || !marketAccount || !contract || !spender) return true;

        const quantity = parseUnits(amount, marketAccount.decimals);

        switch (operation) {
          case 'deposit':
          case 'depositAtMaturity':
          case 'repay':
          case 'repayAtMaturity':
            if (symbol === 'WETH') return false;
            break;
          case 'borrow':
          case 'borrowAtMaturity':
          case 'withdraw':
          case 'withdrawAtMaturity': {
            if (symbol !== 'WETH') return false;
            const shares = await contract.read.previewWithdraw([quantity], opts);
            const allowance = await contract.read.allowance([walletAddress, spender], opts);
            return allowance < shares;
          }
        }

        const allowance = await contract.read.allowance([walletAddress, spender], opts);
        return allowance < quantity;
      } catch {
        return true;
      }
    },
    [operation, walletAddress, marketAccount, contract, spender, symbol, opts],
  );

  const approve = useCallback(async () => {
    if (!contract || !spender || !walletAddress || !marketAccount || !qty || !opts) return;

    try {
      let quantity = 0n;
      switch (operation) {
        case 'deposit':
        case 'depositAtMaturity':
          quantity = parseUnits(qty, marketAccount.decimals);
          break;
        case 'repay':
        case 'repayAtMaturity':
          quantity = (parseUnits(qty, marketAccount.decimals) * 1005n) / 1000n;
          break;
        case 'borrow':
        case 'borrowAtMaturity':
        case 'withdraw':
        case 'withdrawAtMaturity':
          quantity =
            ((await contract.read.previewWithdraw([parseUnits(qty, marketAccount.decimals)], opts)) * 1005n) / 1000n;
          break;
      }

      setIsLoading(true);
      transaction.addToCart('approve');

      setLoadingButton({ label: t('Sign the transaction on your wallet') });
      const args = [spender, quantity] as const;

      let hash: Hex;
      switch (operation) {
        case 'deposit':
        case 'depositAtMaturity':
        case 'repay':
        case 'repayAtMaturity': {
          const gas = await contract.estimateGas.approve(args, opts);
          hash = await contract.write.approve(args, {
            ...opts,
            gasLimit: gasLimit(gas),
          });
          break;
        }
        case 'withdraw':
        case 'withdrawAtMaturity':
        case 'borrow':
        case 'borrowAtMaturity': {
          const gas = await contract.estimateGas.approve(args, opts);
          hash = await contract.write.approve(args, {
            ...opts,
            gasLimit: gasLimit(gas),
          });
          break;
        }
      }

      if (!hash) return;

      transaction.beginCheckout('approve');

      setLoadingButton({ withCircularProgress: true, label: t('Approving {{symbol}}', { symbol }) });
      const { status } = await waitForTransaction({ hash });
      if (status === 'reverted') throw new Error('Transaction reverted');

      transaction.purchase('approve');
    } catch (error) {
      transaction.removeFromCart('approve');

      setErrorData({ status: true, message: handleOperationError(error) });
    } finally {
      setIsLoading(false);
      setLoadingButton({});
    }
  }, [
    contract,
    spender,
    walletAddress,
    marketAccount,
    opts,
    transaction,
    setLoadingButton,
    t,
    operation,
    qty,
    symbol,
    setErrorData,
  ]);

  return { approve, needsApproval, estimateGas, isLoading };
}

export default useApprove;
