import { useSearchParams } from 'next/navigation';
import { type Chain } from 'wagmi';
import * as wagmiChains from 'wagmi/chains';

import { isSupported, defaultChain } from '../utils/chain';

export default function useQueryChain(): Chain {
  const query = useSearchParams();
  const n = query.get('n');
  if (n === null) {
    return defaultChain;
  }

  const queryChain = wagmiChains[n as keyof typeof wagmiChains];
  if (queryChain && isSupported(queryChain?.id)) {
    return queryChain;
  }

  return defaultChain;
}
