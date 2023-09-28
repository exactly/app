import { useCallback } from 'react';
import request from 'graphql-request';

import networkData from 'config/networkData.json' assert { type: 'json' };
import { useWeb3 } from './useWeb3';
import { useGlobalError } from 'contexts/GlobalErrorContext';

export default function useGraphClient() {
  const { chain } = useWeb3();
  const { setIndexerError } = useGlobalError();

  return useCallback(
    async <T>(query: string, sablier: boolean = false): Promise<T | undefined> => {
      const subgraphType = sablier ? 'sablierSubgraph' : 'subgraph';

      const subgraphUrl = networkData[String(chain.id) as keyof typeof networkData]?.[subgraphType];
      if (!subgraphUrl) return undefined;

      try {
        return request<T>(subgraphUrl, query);
      } catch {
        setIndexerError();
        return undefined;
      }
    },
    [chain.id, setIndexerError],
  );
}
