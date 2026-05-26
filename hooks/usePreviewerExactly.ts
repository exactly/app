import { zeroAddress } from 'viem';
import {
  legacyPreviewerAddress,
  previewerAddress,
  useReadLegacyPreviewerExactly,
  useReadPreviewerExactly,
} from 'generated/wagmi';

import { defaultChain } from 'utils/client';
import useReadOnly from 'hooks/useReadOnly';

export default (override?: number) => {
  const { account: walletAddress } = useReadOnly();
  const chainId = override ?? defaultChain.id;
  const legacyPreviewerChainId = Object.keys(legacyPreviewerAddress)
    .map(Number)
    .find((id): id is keyof typeof legacyPreviewerAddress => id === chainId);
  const previewerChainId = Object.keys(previewerAddress)
    .map(Number)
    .find((id): id is keyof typeof previewerAddress => id === chainId);

  const legacy = useReadLegacyPreviewerExactly({
    chainId: legacyPreviewerChainId,
    args: [walletAddress ?? zeroAddress],
    query: { enabled: legacyPreviewerChainId !== undefined, staleTime: 5_000 },
  });
  const current = useReadPreviewerExactly({
    chainId: previewerChainId,
    args: [walletAddress ?? zeroAddress],
    query: { enabled: previewerChainId !== undefined, staleTime: 5_000 },
  });

  return legacyPreviewerChainId === undefined ? current : legacy;
};
