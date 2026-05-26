import SafeAppsSDK, { TransactionStatus } from '@safe-global/safe-apps-sdk';
import {
  getConnection,
  waitForTransactionReceipt,
  type WaitForTransactionReceiptParameters,
  type WaitForTransactionReceiptReturnType,
} from '@wagmi/core';
import type { Hash } from 'viem';
import { isE2E, wagmi } from './client';

export type WaitForTransactionArgs = WaitForTransactionReceiptParameters<typeof wagmi>;
export type WaitForTransactionResult = WaitForTransactionReceiptReturnType<typeof wagmi>;

export default async function waitForTransaction(args: WaitForTransactionArgs): Promise<WaitForTransactionResult> {
  const connection = getConnection(wagmi);
  if (connection.connector?.id !== 'safe') {
    return waitForTransactionReceipt(wagmi, isE2E ? { pollingInterval: 100, ...args } : args);
  }

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
  return waitForTransactionReceipt(wagmi, isE2E ? { pollingInterval: 100, ...args, hash } : { ...args, hash });
}
