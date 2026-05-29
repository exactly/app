import { useCallback, useEffect, useMemo, useState } from 'react';
import { Hex } from 'viem';
import { useSendCalls, useWaitForCallsStatus } from 'wagmi';
import {
  installmentsRouterAbi,
  installmentsRouterAddress,
  marketAbi,
  useReadMarketAllowance,
  useSimulateInstallmentsRouterBorrow,
  useSimulateInstallmentsRouterBorrowEth,
  useSimulateMarketApprove,
} from 'generated/wagmi';
import { useOperationContext } from 'contexts/OperationContext';
import handleOperationError from 'utils/handleOperationError';
import useMarketPermit from 'hooks/useMarketPermit';
import useIsContract from 'hooks/useIsContract';
import { track } from 'utils/mixpanel';
import { WAD } from '@exactly/lib';
import { defaultChain } from 'utils/client';
import useReadOnly from 'hooks/useReadOnly';
import useAccountData from './useAccountData';

type Permit = {
  value: bigint;
  deadline: bigint;
  v: number;
  r: Hex;
  s: Hex;
};

export default function useBorrowInInstallments() {
  const { installmentsDetails, installments, date, symbol, slippage, receiver, setErrorData } = useOperationContext();
  const { marketAccount, refreshAccountData } = useAccountData(symbol);
  const { account: walletAddress } = useReadOnly();
  const [permit, setPermit] = useState<Permit>();
  const [signingPermit, setSigningPermit] = useState(false);
  const [callId, setCallId] = useState<string>();
  const { mutateAsync: sendCalls, isPending: sendCallsPending } = useSendCalls();
  const installmentsRouterChainId = Object.keys(installmentsRouterAddress)
    .map(Number)
    .find((chainId): chainId is keyof typeof installmentsRouterAddress => chainId === defaultChain.id);
  const installmentsRouter =
    installmentsRouterChainId === undefined ? undefined : installmentsRouterAddress[installmentsRouterChainId];
  const marketPermit = useMarketPermit(symbol);
  const isContract = useIsContract();
  const maxRepay = installmentsDetails ? (installmentsDetails.maxRepay * slippage) / WAD : 0n;
  const isBorrowETH = symbol === 'WETH';

  const commonArgs = useMemo(() => {
    if (!date || !installmentsDetails) return;
    return [date, installmentsDetails.installmentsPrincipal, maxRepay] as const;
  }, [date, installmentsDetails, maxRepay]);

  const borrowArgs = useMemo(() => {
    if (!marketAccount || !commonArgs || installments === 1 || !walletAddress) return;
    const args = [marketAccount.market, ...commonArgs] as const;
    return permit ? ([...args, permit] as const) : ([...args, receiver ?? walletAddress] as const);
  }, [commonArgs, installments, marketAccount, permit, receiver, walletAddress]);

  const borrowETHArgs = useMemo(() => {
    if (!commonArgs || installments === 1 || !walletAddress) return;
    return permit
      ? ([...commonArgs, permit, receiver ?? walletAddress] as const)
      : ([...commonArgs, receiver ?? walletAddress] as const);
  }, [commonArgs, installments, permit, receiver, walletAddress]);

  const borrowSimulation = useSimulateInstallmentsRouterBorrow({
    account: walletAddress,
    chainId: installmentsRouterChainId,
    args: borrowArgs,
    query: { enabled: !isBorrowETH && Boolean(installmentsRouterChainId !== undefined && borrowArgs) },
  });
  const borrowETHSimulation = useSimulateInstallmentsRouterBorrowEth({
    account: walletAddress,
    chainId: installmentsRouterChainId,
    args: borrowETHArgs,
    query: { enabled: isBorrowETH && Boolean(installmentsRouterChainId !== undefined && borrowETHArgs) },
  });
  const allowance = useReadMarketAllowance({
    address: marketAccount?.market,
    args: walletAddress && installmentsRouter ? [walletAddress, installmentsRouter] : undefined,
    chainId: defaultChain.id,
    query: { enabled: Boolean(walletAddress && installmentsRouter && marketAccount) },
  });
  const needsApproval = useMemo(() => {
    if (allowance.data === undefined) return true;
    return !permit && allowance.data < maxRepay;
  }, [allowance.data, maxRepay, permit]);
  const approveSimulation = useSimulateMarketApprove({
    address: marketAccount?.market,
    args: installmentsRouter ? [installmentsRouter, maxRepay] : undefined,
    account: walletAddress,
    chainId: defaultChain.id,
    query: { enabled: Boolean(needsApproval && !permit && marketAccount && installmentsRouter) },
  });
  const callsStatus = useWaitForCallsStatus({
    id: callId,
    query: { enabled: Boolean(callId) },
  });
  const txHash = callsStatus.data?.receipts?.[0]?.transactionHash;
  const txStatus = useMemo<'loading' | 'processing' | 'success' | 'error' | undefined>(() => {
    if (!callId) return;
    if (callsStatus.data?.status === 'success') return 'success';
    if (callsStatus.data?.status === 'failure' || callsStatus.isError) return 'error';
    return 'processing';
  }, [callId, callsStatus.data?.status, callsStatus.isError]);

  useEffect(() => {
    if (!callsStatus.data?.receipts?.length) return;
    void refreshAccountData();
    void allowance.refetch();
  }, [allowance, callsStatus.data?.receipts, refreshAccountData]);

  useEffect(() => {
    const error = approveSimulation.error || (isBorrowETH ? borrowETHSimulation.error : borrowSimulation.error);
    if (!error) return;
    setErrorData({ status: true, message: handleOperationError(error), component: 'simulation' });
  }, [approveSimulation.error, borrowETHSimulation.error, borrowSimulation.error, isBorrowETH, setErrorData]);

  const signPermit = useCallback(async () => {
    if (!installmentsRouter || !marketAccount) return;
    setSigningPermit(true);
    try {
      setPermit(
        await marketPermit({
          spender: installmentsRouter,
          value: maxRepay,
          duration: 3_600, // TODO check if correct
        }),
      );
    } catch (error) {
      setErrorData({ status: true, message: handleOperationError(error) });
    } finally {
      setSigningPermit(false);
    }
  }, [installmentsRouter, marketAccount, marketPermit, maxRepay, setErrorData]);

  const borrow = useCallback(async () => {
    if (!installmentsRouter || !marketAccount || !walletAddress || !commonArgs) return;
    setCallId(undefined);
    try {
      const shouldApprove = !permit && (allowance.data ?? (await allowance.refetch()).data ?? 0n) < maxRepay;
      if (shouldApprove && approveSimulation.error) throw approveSimulation.error;
      if (isBorrowETH && borrowETHSimulation.error) throw borrowETHSimulation.error;
      if (!isBorrowETH && borrowSimulation.error) throw borrowSimulation.error;
      const { id } = await sendCalls({
        chainId: defaultChain.id,
        experimental_fallback: true,
        calls: [
          ...(shouldApprove
            ? [
                {
                  to: marketAccount.market,
                  abi: marketAbi,
                  functionName: 'approve',
                  args: [installmentsRouter, maxRepay],
                } as const,
              ]
            : []),
          isBorrowETH
            ? permit
              ? {
                  to: installmentsRouter,
                  abi: installmentsRouterAbi,
                  functionName: 'borrowETH',
                  args: [...commonArgs, permit, receiver ?? walletAddress],
                }
              : {
                  to: installmentsRouter,
                  abi: installmentsRouterAbi,
                  functionName: 'borrowETH',
                  args: [...commonArgs, receiver ?? walletAddress],
                }
            : permit
              ? {
                  to: installmentsRouter,
                  abi: installmentsRouterAbi,
                  functionName: 'borrow',
                  args: [marketAccount.market, ...commonArgs, permit],
                }
              : {
                  to: installmentsRouter,
                  abi: installmentsRouterAbi,
                  functionName: 'borrow',
                  args: [marketAccount.market, ...commonArgs, receiver ?? walletAddress],
                },
        ],
      });
      setCallId(id);
      track('TX Signed', {
        contractName: 'InstallmentsRouter',
        method: 'borrow',
        callId: id,
        symbol,
        amount: installmentsDetails?.installmentsPrincipal.map(String).join(','),
        maturity: Number(date),
      });
    } catch (error) {
      setErrorData({ status: true, message: handleOperationError(error) });
    }
  }, [
    allowance,
    approveSimulation.error,
    borrowETHSimulation.error,
    borrowSimulation.error,
    commonArgs,
    date,
    installmentsDetails?.installmentsPrincipal,
    installmentsRouter,
    isBorrowETH,
    marketAccount,
    maxRepay,
    permit,
    receiver,
    sendCalls,
    setErrorData,
    symbol,
    walletAddress,
  ]);

  const handleSubmitAction = useCallback(async () => {
    if (!walletAddress) return;
    if (needsApproval && !permit && !(await isContract(walletAddress))) {
      await signPermit();
      return;
    }
    return borrow();
  }, [borrow, isContract, needsApproval, permit, signPermit, walletAddress]);

  return {
    handleSubmitAction,
    needsApproval,
    txStatus,
    txHash,
    isLoading:
      sendCallsPending ||
      callsStatus.isLoading ||
      signingPermit ||
      allowance.isLoading ||
      approveSimulation.isLoading ||
      borrowSimulation.isLoading ||
      borrowETHSimulation.isLoading,
  };
}
