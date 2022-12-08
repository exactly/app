import { useMemo } from 'react';
import { Contract } from '@ethersproject/contracts';
import { useNetwork, useProvider } from 'wagmi';
import type { Previewer } from 'types/contracts/Previewer';
import mainnetPreviewer from '@exactly-protocol/protocol/deployments/mainnet/Previewer.json' assert { type: 'json' };
import goerliPreviewer from '@exactly-protocol/protocol/deployments/goerli/Previewer.json' assert { type: 'json' };
import previewerABI from 'abi/Previewer.json' assert { type: 'json' };

export default () => {
  const { chain } = useNetwork();
  const provider = useProvider();

  return useMemo(() => {
    if (!provider || !chain) return null;

    const address = {
      goerli: goerliPreviewer.address,
      mainnet: mainnetPreviewer.address,
    }[chain.network];
    if (!address) return null;

    return new Contract(address, previewerABI, provider) as Previewer;
  }, [chain, provider]);
};
