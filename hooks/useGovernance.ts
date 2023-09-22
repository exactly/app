import snapshot from '@snapshot-labs/snapshot.js';
import { useWeb3 } from './useWeb3';
import { useCallback, useEffect, useMemo, useState } from 'react';
import optimismEXA from '@exactly/protocol/deployments/optimism/EXA.json';
import goerliEXA from '@exactly/protocol/deployments/goerli/EXA.json';

export default function useGovernance(delegation = true) {
  const [votingPower, setVotingPower] = useState<number | undefined>(undefined);
  const { chain, walletAddress } = useWeb3();

  const exaAddress = useMemo(() => (chain.id === 10 ? optimismEXA.address : goerliEXA.address), [chain.id]);
  const space = useMemo(() => (chain.id === 10 ? 'gov.exa.eth' : 'exa.eth'), [chain.id]);

  const strategies = useMemo(
    () => [
      {
        name: 'erc20-balance-of',
        params: {
          symbol: 'EXA',
          address: exaAddress,
          decimals: 18,
        },
      },
      {
        name: 'sablier-v2',
        params: {
          policy: 'reserved-recipient',
          symbol: 'EXA',
          address: exaAddress,
          decimals: 18,
        },
      },
    ],
    [exaAddress],
  );

  const url = 'https://score.snapshot.org/';

  const fetchVotingPower = useCallback(async () => {
    if (!walletAddress) return;
    const { vp } = await snapshot.utils.getVp(
      walletAddress,
      String(chain.id),
      strategies,
      'latest',
      space,
      delegation,
      {
        url,
      },
    );
    setVotingPower(vp);
    return vp;
  }, [chain.id, delegation, space, strategies, walletAddress]);

  useEffect(() => {
    fetchVotingPower();
  }, [fetchVotingPower]);

  return { votingPower, fetchVotingPower };
}
