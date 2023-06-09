import { useMemo } from 'react';
import { usePublicClient } from 'wagmi';
import { getContract } from '@wagmi/core';
import { isAddress } from 'viem';
import { mainnet, goerli, optimism } from 'wagmi/chains';

import { useWeb3 } from './useWeb3';
import { previewerABI } from 'types/abi';
import mainnetPreviewer from '@exactly/protocol/deployments/mainnet/Previewer.json' assert { type: 'json' };
import optimismPreviewer from '@exactly/protocol/deployments/optimism/Previewer.json' assert { type: 'json' };
import goerliPreviewer from '@exactly/protocol/deployments/goerli/Previewer.json' assert { type: 'json' };
import { Previewer } from 'types/contracts';

export default (): Previewer | undefined => {
  const publicClient = usePublicClient();
  const { chain } = useWeb3();

  return useMemo(() => {
    const address = {
      [goerli.id]: goerliPreviewer.address,
      [optimism.id]: optimismPreviewer.address,
      [mainnet.id]: mainnetPreviewer.address,
    }[chain.id];

    if (!address || !isAddress(address)) return;

    return getContract({
      chainId: chain.id,
      address,
      abi: previewerABI,
      publicClient,
    });
  }, [chain.id, publicClient]);
};
