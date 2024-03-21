import { useCallback, useEffect, useMemo, useState } from 'react';
import { Hex, zeroAddress } from 'viem';
import { installmentsRouterABI, useInstallmentsRouterBorrow, usePrepareInstallmentsRouterBorrow } from 'types/abi';
import { useOperationContext } from 'contexts/OperationContext';
import handleOperationError from 'utils/handleOperationError';
import { WEI_PER_ETHER } from 'utils/const';
import { Transaction } from 'types/Transaction';
import useWaitForTransaction from 'hooks/useWaitForTransaction';
import useMarketPermit from 'hooks/useMarketPermit';
import useContract from 'hooks/useContract';
import { useWeb3 } from 'hooks/useWeb3';
import useIsContract from './useIsContract';
import { track } from '../utils/mixpanel';
import waitForTransaction from '../utils/waitForTransaction';
import formatNumber from '../utils/formatNumber';

type Permit = {
  value: bigint;
  deadline: bigint;
  v: number;
  r: Hex;
  s: Hex;
};

export default function useBorrowInInstallments() {
  const { installmentsDetails, marketContract, date, symbol, slippage, setTx, setErrorData } = useOperationContext();
  const { walletAddress, opts, chain } = useWeb3();
  const [permit, setPermit] = useState<Permit>();
  const [signingPermit, setSigningPermit] = useState(false);
  const [approveStatus, setApproveStatus] = useState<'idle' | 'pending' | 'success'>('idle');
  const installmentsRouter = useContract('InstallmentsRouter', installmentsRouterABI);
  const marketPermit = useMarketPermit(symbol);
  const isContract = useIsContract();
  const maxRepay = installmentsDetails ? (installmentsDetails.maxRepay * slippage) / WEI_PER_ETHER : 0n;

  const config = useMemo(() => {
    if (!marketContract || !installmentsDetails || !date || !installmentsRouter) return;
    const args = [marketContract.address, date, installmentsDetails.installmentsPrincipal, maxRepay] as const;
    return {
      ...opts,
      chainId: chain.id,
      enabled: true,
      address: installmentsRouter.address,
      account: walletAddress ?? zeroAddress,
      args: permit ? ([...args, permit] as const) : args,
    };
  }, [chain.id, date, installmentsDetails, installmentsRouter, marketContract, maxRepay, opts, permit, walletAddress]);

  const prepare = usePrepareInstallmentsRouterBorrow(config);
  const installmentsBorrow = useInstallmentsRouterBorrow(prepare.config);

  const { isLoading: waitingInstallmentsBorrow } = useWaitForTransaction({
    hash: installmentsBorrow.data?.hash,
    onSettled: (tx) => setTx(tx as Transaction),
  });

  const signInstallmentsPermit = useCallback(async () => {
    if (!installmentsRouter || !marketContract) return;
    setSigningPermit(true);
    try {
      const shares = await marketContract.read.previewWithdraw([maxRepay], opts);
      setPermit(
        await marketPermit({
          spender: installmentsRouter.address,
          value: shares,
          duration: 3_600, // TODO check if correct
        }),
      );
    } catch (error) {
      setErrorData({
        status: true,
        message: handleOperationError(error),
      });
    } finally {
      setSigningPermit(false);
    }
  }, [installmentsRouter, marketContract, marketPermit, maxRepay, opts, setErrorData]);

  const borrow = useCallback(async () => {
    if (!installmentsBorrow.writeAsync) return;
    setPermit(undefined);
    try {
      const { hash } = await installmentsBorrow.writeAsync();
      if (hash)
        setTx({
          status: 'processing',
          hash,
        });
    } catch (error) {
      setErrorData({
        status: true,
        message: handleOperationError(error),
      });
    }
  }, [installmentsBorrow, setErrorData, setTx]);

  const approve = useCallback(async () => {
    if (!marketContract || !installmentsRouter || !walletAddress || !opts) return;
    setApproveStatus('pending');
    try {
      const shares = await marketContract.read.previewWithdraw([maxRepay], opts);
      const allowance = await marketContract.read.allowance([walletAddress, installmentsRouter.address]);
      if (allowance < shares) {
        const args = [installmentsRouter.address, shares] as const;
        const gas = await marketContract.estimateGas.approve(args, opts);
        const hash = await marketContract.write.approve(args, {
          ...opts,
          gasLimit: gas,
        });

        const amount = formatNumber(shares, symbol);
        track('TX Signed', {
          contractName: 'Market',
          method: 'approve',
          amount,
          hash,
        });
        const { status } = await waitForTransaction({ hash });
        track('TX Completed', {
          contractName: 'Market',
          method: 'approve',
          amount,
          hash,
          status,
          symbol,
        });
      }
      setApproveStatus('success');
    } catch (error) {
      setErrorData({
        status: true,
        message: handleOperationError(error),
      });
      setApproveStatus('idle');
    }
  }, [installmentsRouter, marketContract, maxRepay, opts, setErrorData, symbol, walletAddress]);

  const handleSubmitAction = useCallback(async () => {
    if (!walletAddress) return;
    const isMultiSig = await isContract(walletAddress);
    if (isMultiSig) {
      await approve();
    } else {
      await signInstallmentsPermit();
    }
  }, [approve, isContract, signInstallmentsPermit, walletAddress]);

  useEffect(() => {
    if (permit) borrow();
  }, [borrow, permit]);

  useEffect(() => {
    if (approveStatus === 'success') {
      setApproveStatus('idle');
      borrow();
    }
  }, [approveStatus, borrow]);

  return {
    handleSubmitAction,
    isLoading:
      installmentsBorrow.isLoading || waitingInstallmentsBorrow || signingPermit || approveStatus === 'pending',
  };
}
