import { parseFixed } from '@ethersproject/bignumber';
import { MaxUint256, WeiPerEther } from '@ethersproject/constants';
import { ErrorCode } from '@ethersproject/logger';
import { useCallback, useState } from 'react';
import { ERC20, Market } from 'types/contracts';
import numbers from 'config/numbers.json';
import { Operation } from 'contexts/ModalStatusContext';
import { useWeb3 } from './useWeb3';
import { useOperationContext } from 'contexts/OperationContext';
import useAccountData from './useAccountData';
import handleOperationError from 'utils/handleOperationError';
import { useNetwork } from 'wagmi';
import { useTranslation } from 'react-i18next';
import { gasLimitMultiplier } from 'utils/const';

export default (operation: Operation, contract?: ERC20 | Market, spender?: string) => {
  const { t } = useTranslation();
  const { walletAddress, chain: displayNetwork } = useWeb3();
  const { chain } = useNetwork();
  const { symbol, setErrorData, setLoadingButton } = useOperationContext();
  const [isLoading, setIsLoading] = useState(false);

  const { marketAccount } = useAccountData(symbol);

  const estimateGas = useCallback(async () => {
    if (!contract || !spender) return;

    return await contract.estimateGas.approve(spender, MaxUint256);
  }, [contract, spender]);

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
        const allowance = await contract.allowance(walletAddress, spender);
        return (
          allowance.isZero() || allowance.lt(parseFixed(qty || String(numbers.defaultAmount), marketAccount.decimals))
        );
      } catch {
        return true;
      }
    },
    [operation, chain, walletAddress, marketAccount, contract, spender, displayNetwork.id, symbol],
  );

  const approve = useCallback(async () => {
    if (!contract || !spender) return;

    try {
      setIsLoading(true);
      setLoadingButton({ label: t('Sign the transaction on your wallet') });
      const gasEstimation = await estimateGas();
      if (!gasEstimation) return;

      const approveTx = await contract.approve(spender, MaxUint256, {
        gasLimit: gasEstimation.mul(gasLimitMultiplier).div(WeiPerEther),
      });
      setLoadingButton({ withCircularProgress: true, label: t('Approving {{symbol}}', { symbol }) });
      await approveTx.wait();
    } catch (error) {
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
  }, [contract, spender, setLoadingButton, estimateGas, symbol, setErrorData, t]);

  return { approve, needsApproval, estimateGas, isLoading };
};
