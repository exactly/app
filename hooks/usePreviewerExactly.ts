import { isAddress, zeroAddress } from 'viem';
import { mainnet, goerli, optimism } from 'wagmi/chains';

import { useWeb3 } from './useWeb3';
import { usePreviewerExactly } from 'types/abi';
import mainnetPreviewer from '@exactly/protocol/deployments/ethereum/Previewer.json' assert { type: 'json' };
import optimismPreviewer from '@exactly/protocol/deployments/optimism/Previewer.json' assert { type: 'json' };
import goerliPreviewer from '@exactly/protocol/deployments/goerli/Previewer.json' assert { type: 'json' };

export default (override?: number) => {
  const { chain, walletAddress } = useWeb3();

  const address = {
    [goerli.id]: goerliPreviewer.address,
    [optimism.id]: optimismPreviewer.address,
    [mainnet.id]: mainnetPreviewer.address,
  }[override ?? chain.id];

  if (!address || !isAddress(address)) throw new Error(`No deployment for ${chain.id}`);

  return usePreviewerExactly({
    chainId: override ?? chain.id,
    address,
    args: [walletAddress ?? zeroAddress],
    staleTime: 5_000,
  });
};
