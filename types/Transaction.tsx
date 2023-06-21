import type { Hex, WalletClient } from 'viem';

export type Transaction = {
  status: 'loading' | 'processing' | 'success' | 'error';
  hash?: Hex;
};

export type PopulatedTransaction = Parameters<WalletClient['writeContract']>[0];
