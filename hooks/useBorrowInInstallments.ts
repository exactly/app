import { useCallback, useMemo, useState } from 'react';
import { Hex, TransactionReceipt, zeroAddress } from 'viem';
import {
  installmentsRouterABI,
  useInstallmentsRouterBorrow,
  useInstallmentsRouterBorrowEth,
  usePrepareInstallmentsRouterBorrow,
  usePrepareInstallmentsRouterBorrowEth,
} from 'types/abi';
import { useOperationContext } from 'contexts/OperationContext';
import handleOperationError from 'utils/handleOperationError';
import useWaitForTransaction from 'hooks/useWaitForTransaction';
import useMarketPermit from 'hooks/useMarketPermit';
import useContract from 'hooks/useContract';
import { useWeb3 } from 'hooks/useWeb3';
import useIsContract from 'hooks/useIsContract';
import { track } from 'utils/mixpanel';
import waitForTransaction from 'utils/waitForTransaction';
import formatNumber from 'utils/formatNumber';
import WAD from '@exactly/lib/esm/fixed-point-math/WAD';
import { erc20ABI, useContractRead } from 'wagmi';

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
  const maxRepay = installmentsDetails ? (installmentsDetails.maxRepay * slippage) / WAD : 0n;
  const isBorrowETH = symbol === 'WETH';

  const commonArgs = useMemo(() => {
    if (!date || !installmentsDetails || !installmentsRouter) return;
    return [date, installmentsDetails.installmentsPrincipal, maxRepay] as const;
  }, [date, installmentsDetails, installmentsRouter, maxRepay]);

  const config = useMemo(() => {
    if (!marketContract || !commonArgs || !installmentsRouter) return;
    const args = [marketContract.address, ...commonArgs] as const;
    return {
      ...opts,
      chainId: chain.id,
      enabled: true,
      address: installmentsRouter.address,
      account: walletAddress ?? zeroAddress,
      args: permit ? ([...args, permit] as const) : args,
    };
  }, [chain.id, commonArgs, installmentsRouter, marketContract, opts, permit, walletAddress]);

  const ethConfig = useMemo(() => {
    if (!commonArgs) return;
    const args = permit ? ([...commonArgs, permit] as const) : commonArgs;
    return { ...config, args };
  }, [commonArgs, config, permit]);

  const prepare = usePrepareInstallmentsRouterBorrow(config);
  const prepareETH = usePrepareInstallmentsRouterBorrowEth(ethConfig);
  const installmentsBorrow = useInstallmentsRouterBorrow(prepare.config);
  const installmentsBorrowETH = useInstallmentsRouterBorrowEth(prepareETH.config);

  const handleSettled = useCallback(
    (tx?: TransactionReceipt) => {
      if (!tx) return;
      setTx({
        status: tx.status === 'reverted' ? 'error' : tx.status,
        hash: tx.transactionHash,
      });
    },
    [setTx],
  );

  const { isLoading: waitingInstallmentsBorrow } = useWaitForTransaction({
    hash: installmentsBorrow.data?.hash,
    onSettled: handleSettled,
  });

  const { isLoading: waitingInstallmentsBorrowETH } = useWaitForTransaction({
    hash: installmentsBorrowETH.data?.hash,
    onSettled: handleSettled,
  });

  const allowance = useContractRead(
    walletAddress && installmentsRouter && marketContract
      ? {
          abi: erc20ABI,
          functionName: 'allowance',
          address: marketContract.address,
          args: [walletAddress, installmentsRouter.address],
        }
      : undefined,
  );

  const signPermit = useCallback(async () => {
    if (!installmentsRouter || !marketContract) return;
    setSigningPermit(true);
    try {
      setPermit(
        await marketPermit({
          spender: installmentsRouter.address,
          value: maxRepay,
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
  }, [installmentsRouter, marketContract, marketPermit, maxRepay, setErrorData]);

  const approve = useCallback(async () => {
    if (!marketContract || !installmentsRouter || !walletAddress || !opts) return;
    setApproveStatus('pending');
    try {
      const args = [installmentsRouter.address, maxRepay] as const;
      const gas = await marketContract.estimateGas.approve(args, opts);
      const hash = await marketContract.write.approve(args, {
        ...opts,
        gasLimit: gas,
      });

      const amount = formatNumber(maxRepay, symbol);
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
      allowance.refetch();
      setApproveStatus('success');
    } catch (error) {
      setErrorData({
        status: true,
        message: handleOperationError(error),
      });
      setApproveStatus('idle');
    }
  }, [allowance, installmentsRouter, marketContract, maxRepay, opts, setErrorData, symbol, walletAddress]);

  const borrow = useCallback(() => {
    if (isBorrowETH) {
      if (!installmentsBorrowETH.write) return;
      installmentsBorrowETH.write();
    } else {
      if (!installmentsBorrow.write) return;
      installmentsBorrow.write();
    }
  }, [installmentsBorrow, installmentsBorrowETH, isBorrowETH]);

  const needsApproval = useMemo(() => {
    if (!allowance.data) return false;
    const approved = allowance.data >= maxRepay;
    return !permit && !approved;
  }, [allowance.data, maxRepay, permit]);

  const handleSubmitAction = useCallback(async () => {
    if (!walletAddress) return;
    if (needsApproval) {
      if (await isContract(walletAddress)) {
        await approve();
      } else {
        await signPermit();
      }
      return;
    }
    borrow();
  }, [approve, borrow, isContract, needsApproval, signPermit, walletAddress]);

  return {
    handleSubmitAction,
    needsApproval,
    isLoading:
      installmentsBorrow.isLoading ||
      installmentsBorrowETH.isLoading ||
      waitingInstallmentsBorrow ||
      waitingInstallmentsBorrowETH ||
      signingPermit ||
      approveStatus === 'pending' ||
      allowance.isLoading,
  };
}
