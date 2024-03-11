import { useCallback, useEffect, useState } from 'react';
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
  const installmentsRouter = useContract('InstallmentsRouter', installmentsRouterABI);
  const marketPermit = useMarketPermit(symbol);
  const maxRepay = installmentsDetails ? (installmentsDetails.maxRepay * slippage) / WEI_PER_ETHER : 0n;

  const { config: installmentsBorrowConfig } = usePrepareInstallmentsRouterBorrow(
    marketContract && installmentsDetails && date && permit && installmentsRouter
      ? ({
          ...opts,
          chainId: chain.id,
          enabled: true,
          address: installmentsRouter.address,
          account: walletAddress ?? zeroAddress,
          args: [marketContract.address, date, installmentsDetails.installmentsPrincipal, maxRepay, permit],
        } as const)
      : undefined,
  );

  const {
    writeAsync: installmentsBorrowWrite,
    data: installmentsBorrowData,
    isLoading: installmentsBorrowLoading,
  } = useInstallmentsRouterBorrow(installmentsBorrowConfig);

  const { isLoading: waitingInstallmentsBorrow } = useWaitForTransaction({
    hash: installmentsBorrowData?.hash,
    onSettled: (tx) => setTx(tx as Transaction),
  });

  const signInstallmentsPermit = useCallback(async () => {
    if (!installmentsRouter) return;
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
  }, [installmentsRouter, marketPermit, maxRepay, setErrorData]);

  const borrow = useCallback(async () => {
    if (!installmentsBorrowWrite) return;
    setPermit(undefined);
    try {
      const { hash } = await installmentsBorrowWrite();
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
  }, [installmentsBorrowWrite, setErrorData, setTx]);

  useEffect(() => {
    if (permit) borrow();
  }, [borrow, installmentsBorrowWrite, permit]);

  return {
    handleSubmitAction: signInstallmentsPermit,
    isLoading: installmentsBorrowLoading || waitingInstallmentsBorrow || signingPermit,
  };
}
