import { parseFixed } from '@ethersproject/bignumber';
import { MaxUint256, WeiPerEther } from '@ethersproject/constants';
import { ErrorCode } from '@ethersproject/logger';
import { captureException } from '@sentry/nextjs';
import { useCallback, useState } from 'react';
import { ERC20, Market } from 'types/contracts';
import numbers from 'config/numbers.json';
import { Operation } from 'contexts/ModalStatusContext';
import { useWeb3 } from './useWeb3';
import { useOperationContext } from 'contexts/OperationContext';

export default (operation: Operation, contract?: ERC20 | Market, spender?: string) => {
  const { walletAddress } = useWeb3();
  const { symbol, setErrorData } = useOperationContext();
  const [isLoading, setIsLoading] = useState(false);

  const estimateGas = useCallback(async () => {
    if (!contract || !spender) return;

    return contract.estimateGas.approve(spender, MaxUint256);
  }, [spender, contract]);

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

      if (!walletAddress || !contract || !spender) return true;

      try {
        const allowance = await contract.allowance(walletAddress, spender);
        return allowance.lt(parseFixed(qty || String(numbers.defaultAmount), await contract.decimals()));
      } catch {
        return true;
      }
    },
    [operation, symbol, contract, spender, walletAddress],
  );

  const approve = useCallback(async () => {
    if (!contract || !spender) return;

    try {
      setIsLoading(true);
      const gasEstimation = await estimateGas();
      if (!gasEstimation) return;

      const approveTx = await contract.approve(spender, MaxUint256, {
        gasLimit: gasEstimation.mul(parseFixed(String(numbers.gasLimitMultiplier), 18)).div(WeiPerEther),
      });

      // awaits the tx to be confirmed so isLoading stays true
      return await approveTx.wait();
    } catch (error: any) {
      const isDenied = error?.code === ErrorCode.ACTION_REJECTED;

      if (!isDenied) captureException(error);

      setErrorData({
        status: true,
        message: isDenied ? 'Transaction rejected' : 'Approve failed, please try again',
      });
    } finally {
      setIsLoading(false);
    }
  }, [spender, contract, estimateGas, setErrorData]);

  return { approve, needsApproval, estimateGas, isLoading };
};
