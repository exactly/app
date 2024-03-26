import { useMemo } from 'react';
import { getContract } from '@wagmi/core';
import { isAddress } from 'viem';
import { mainnet, optimismSepolia, optimism } from 'wagmi/chains';

import { useWeb3 } from './useWeb3';
import { previewerABI, legacyPreviewerABI } from 'types/abi';
import mainnetPreviewer from '@exactly/protocol/deployments/ethereum/Previewer.json' assert { type: 'json' };
import optimismPreviewer from '@exactly/protocol/deployments/optimism/Previewer.json' assert { type: 'json' };
import sepoliaPreviewer from '@exactly/protocol/deployments/op-sepolia/Previewer.json' assert { type: 'json' };
import { Previewer, LegacyPreviewer } from 'types/contracts';

export default (): Previewer | LegacyPreviewer | undefined => {
  const { chain } = useWeb3();

  return useMemo(() => {
    const address = {
      [optimismSepolia.id]: sepoliaPreviewer.address,
      [optimism.id]: optimismPreviewer.address,
      [mainnet.id]: mainnetPreviewer.address,
    }[chain.id];

    if (!address || !isAddress(address)) return;

    if (chain.id === mainnet.id) {
      return getContract({
        chainId: chain.id,
        address,
        abi: legacyPreviewerABI,
      });
    } else {
      return getContract({
        chainId: chain.id,
        address,
        abi: previewerABI,
      });
    }
  }, [chain.id]);
};
