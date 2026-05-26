import { useCallback } from 'react';
import request from 'graphql-request';

import networkData from 'config/networkData.json' assert { type: 'json' };
import { useGlobalError } from 'contexts/GlobalErrorContext';
import { defaultChain } from 'utils/client';

type Subgraph = 'exactly' | 'sablier';

export default function useGraphClient() {
  const { setIndexerError } = useGlobalError();

  return useCallback(
    async <T>(query: string, subgraph: Subgraph = 'exactly'): Promise<T | undefined> => {
      const subgraphUrl = networkData[String(defaultChain.id) as keyof typeof networkData]?.subgraph[subgraph];
      if (!subgraphUrl) return undefined;

      try {
        return request<T>(subgraphUrl, query);
      } catch {
        setIndexerError();
        return undefined;
      }
    },
    [setIndexerError],
  );
}
