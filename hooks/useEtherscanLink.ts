import { useCallback, useMemo } from 'react';
import { Hex, Address } from 'viem';

import networkData from 'config/networkData.json' assert { type: 'json' };
import { defaultChain } from 'utils/client';

export default function useEtherscanLink() {
  const etherscan = useMemo(() => networkData[String(defaultChain.id) as keyof typeof networkData]?.etherscan, []);

  const tx = useCallback((hash: Hex) => `${etherscan}/tx/${hash}`, [etherscan]);

  const address = useCallback((addr: Address) => `${etherscan}/address/${addr}`, [etherscan]);

  return { tx, address };
}
