import SafeAppsSDK, { TransactionStatus } from '@safe-global/safe-apps-sdk';
import { getConfig, waitForTransaction as wait, type WaitForTransactionArgs } from '@wagmi/core';
import type { Hash } from 'viem';

export default async function waitForTransaction(args: WaitForTransactionArgs) {
  if (getConfig().connector?.id !== 'safe') return wait(args);

  const { txs } = new SafeAppsSDK();
  const hash = await new Promise<Hash>(function get(resolve, reject) {
    txs
      .getBySafeTxHash(args.hash)
      .then(({ txStatus, txHash }) => {
        if (txStatus === TransactionStatus.SUCCESS && txHash) resolve(txHash as Hash);
        else if (txStatus === TransactionStatus.FAILED || txStatus === TransactionStatus.CANCELLED) reject(txStatus);
        else setTimeout(() => get(resolve, reject), 3_333);
      })
      .catch(reject);
  });
  return wait({ ...args, hash });
}
