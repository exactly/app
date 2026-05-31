import { useCallback } from 'react';
import { Hex, Address } from 'viem';

import { defaultChain } from 'utils/client';

const explorer = defaultChain.blockExplorers?.default.url ?? '';

export default function useEtherscanLink() {
  const tx = useCallback((hash: Hex) => `${explorer}/tx/${hash}`, []);

  const address = useCallback((addr: Address) => `${explorer}/address/${addr}`, []);

  return { tx, address };
}
