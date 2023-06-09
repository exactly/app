import { Hex } from 'viem';

export type Transaction = {
  status: 'loading' | 'processing' | 'success' | 'error';
  hash?: Hex;
};
