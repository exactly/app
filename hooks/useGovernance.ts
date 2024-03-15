import snapshot from '@snapshot-labs/snapshot.js';
import { useWeb3 } from './useWeb3';
import { useCallback, useEffect, useState } from 'react';
import exa from '@exactly/protocol/deployments/optimism/EXA.json';
import { optimism } from 'wagmi/chains';

export default function useGovernance(delegation = true) {
  const [votingPower, setVotingPower] = useState<number | undefined>(undefined);
  const { chain, walletAddress } = useWeb3();

  const fetchVotingPower = useCallback(async () => {
    if (!walletAddress) return;
    const { vp } = await snapshot.utils.getVp(
      walletAddress,
      String(chain.id),
      [
        { name: 'erc20-balance-of', params: { symbol: 'EXA', address: exa.address, decimals: 18 } },
        {
          name: 'sablier-v2',
          params: { policy: 'reserved-recipient', symbol: 'EXA', address: exa.address, decimals: 18 },
        },
      ],
      'latest',
      chain.id === optimism.id ? 'gov.exa.eth' : 'exa.eth',
      delegation,
      { url: 'https://score.snapshot.org/' },
    );
    setVotingPower(vp);
    return vp;
  }, [chain.id, delegation, walletAddress]);

  useEffect(() => {
    fetchVotingPower();
  }, [fetchVotingPower]);

  return { votingPower, fetchVotingPower };
}
