import { useCallback, useMemo } from 'react';
import { Hex, Address } from 'viem';

import networkData from 'config/networkData.json' assert { type: 'json' };
import { useWeb3 } from './useWeb3';

export default function useEtherscanLink() {
  const { chain } = useWeb3();

  const etherscan = useMemo(() => networkData[String(chain?.id) as keyof typeof networkData]?.etherscan, [chain.id]);

  const tx = useCallback((hash: Hex) => `${etherscan}/tx/${hash}`, [etherscan]);

  const address = useCallback((addr: Address) => `${etherscan}/address/${addr}`, [etherscan]);

  return { tx, address };
}
