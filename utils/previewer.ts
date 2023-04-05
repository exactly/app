import { Contract } from '@ethersproject/contracts';
import { mainnet, goerli, optimism, Chain } from 'wagmi/chains';
import { Provider } from '@ethersproject/abstract-provider';

import type { Previewer } from 'types/contracts/Previewer';
import mainnetPreviewer from '@exactly-protocol/protocol/deployments/mainnet/Previewer.json' assert { type: 'json' };
import optimismPreviewer from '@exactly-protocol/protocol/deployments/optimism/Previewer.json' assert { type: 'json' };
import goerliPreviewer from '@exactly-protocol/protocol/deployments/goerli/Previewer.json' assert { type: 'json' };
import previewerABI from 'abi/Previewer.json' assert { type: 'json' };

const address: Record<number, string> = {
  [goerli.id]: goerliPreviewer.address,
  [optimism.id]: optimismPreviewer.address,
  [mainnet.id]: mainnetPreviewer.address,
} as const;

export default function previewer(chain: Chain, provider: Provider): Previewer | undefined {
  if (!address[chain.id]) {
    return undefined;
  }
  return new Contract(address[chain.id], previewerABI, provider) as Previewer;
}
