import { useCallback, useState } from 'react';
import { parseUnits } from 'viem';
import { ErrorCode } from '@ethersproject/logger';
import { ERC20 } from 'types/contracts';
import { useWeb3 } from './useWeb3';
import { useOperationContext } from 'contexts/OperationContext';
import useAccountData from './useAccountData';
import handleOperationError from 'utils/handleOperationError';
import { Address, useNetwork } from 'wagmi';
import { useTranslation } from 'react-i18next';
import { MAX_UINT256 } from 'utils/const';
import useEstimateGas from './useEstimateGas';
import useAnalytics from './useAnalytics';
import { waitForTransaction } from '@wagmi/core';
import { gasLimit } from 'utils/gas';
import type { Operation } from 'types/Operation';

export default (operation: Operation, contract?: ERC20, spender?: Address) => {
  const { t } = useTranslation();
  const { walletAddress, chain: displayNetwork, opts } = useWeb3();
  const { chain } = useNetwork();
  const { symbol, setErrorData, setLoadingButton } = useOperationContext();
  const [isLoading, setIsLoading] = useState(false);
  const { transaction } = useAnalytics();

  const { marketAccount } = useAccountData(symbol);

  const estimate = useEstimateGas();

  const estimateGas = useCallback(async () => {
    if (!contract || !spender || !walletAddress || !opts) return;

    const { request } = await contract.simulate.approve([spender, MAX_UINT256], opts);
    return estimate(request);
  }, [contract, spender, walletAddress, estimate, opts]);

  const needsApproval = useCallback(
    async (qty: string): Promise<boolean> => {
      switch (operation) {
        case 'deposit':
        case 'depositAtMaturity':
        case 'repay':
        case 'repayAtMaturity':
          if (symbol === 'WETH') return false;
          break;
        case 'withdraw':
        case 'withdrawAtMaturity':
        case 'borrow':
        case 'borrowAtMaturity':
          if (symbol !== 'WETH') return false;
          break;
      }

      if (!walletAddress || !marketAccount || !contract || !spender) return true;

      if (chain?.id !== displayNetwork.id) return true;

      try {
        const allowance = await contract.read.allowance([walletAddress, spender], opts);
        return allowance === 0n || allowance < parseUnits(qty, marketAccount.decimals);
      } catch {
        return true;
      }
    },
    [operation, walletAddress, marketAccount, contract, spender, chain?.id, displayNetwork.id, symbol, opts],
  );

  const approve = useCallback(async () => {
    if (!contract || !spender || !walletAddress || !opts) return;

    try {
      setIsLoading(true);
      transaction.addToCart('approve');

      setLoadingButton({ label: t('Sign the transaction on your wallet') });
      const args = [spender, MAX_UINT256] as const;
      const gasEstimation = await contract.estimateGas.approve(args, opts);
      const hash = await contract.write.approve(args, {
        ...opts,
        gasLimit: gasLimit(gasEstimation),
      });

      transaction.beginCheckout('approve');

      setLoadingButton({ withCircularProgress: true, label: t('Approving {{symbol}}', { symbol }) });

      const { status } = await waitForTransaction({ hash });
      if (status) transaction.purchase('approve');
    } catch (error) {
      transaction.removeFromCart('approve');
      const isDenied = [ErrorCode.ACTION_REJECTED, ErrorCode.TRANSACTION_REPLACED].includes(
        (error as { code: ErrorCode }).code,
      );

      if (!isDenied) handleOperationError(error);

      setErrorData({
        status: true,
        message: isDenied ? t('Transaction rejected') : t('Approve failed, please try again'),
      });
    } finally {
      setIsLoading(false);
      setLoadingButton({});
    }
  }, [contract, spender, walletAddress, opts, transaction, setLoadingButton, t, symbol, setErrorData]);

  return { approve, needsApproval, estimateGas, isLoading };
};
