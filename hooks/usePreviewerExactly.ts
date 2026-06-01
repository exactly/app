import { zeroAddress } from 'viem';
import { AbiParametersToPrimitiveTypes, ExtractAbiFunction } from 'abitype';
import {
  legacyPreviewerAbi,
  legacyPreviewerAddress,
  previewerAbi,
  previewerAddress,
  useReadLegacyPreviewerExactly,
  useReadPreviewerExactly,
} from 'generated/wagmi';

import { defaultChain } from 'utils/client';
import useReadOnly from 'hooks/useReadOnly';

type NewMarketAccount = AbiParametersToPrimitiveTypes<
  ExtractAbiFunction<typeof previewerAbi, 'exactly'>['outputs']
>[number][number];

export type LegacyMarketAccount = AbiParametersToPrimitiveTypes<
  ExtractAbiFunction<typeof legacyPreviewerAbi, 'exactly'>['outputs']
>[number][number];

export type MarketAccount = NewMarketAccount | LegacyMarketAccount;

const applyAssetSymbol = (data: readonly MarketAccount[]) =>
  data.map((item) =>
    'symbol' in item && item.symbol.startsWith('exa') ? { ...item, assetSymbol: item.symbol.slice(3) } : item,
  );

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
    query: {
      enabled: legacyPreviewerChainId !== undefined,
      staleTime: 5_000,
      refetchInterval: 600_000,
      select: applyAssetSymbol,
    },
  });
  const current = useReadPreviewerExactly({
    chainId: previewerChainId,
    args: [walletAddress ?? zeroAddress],
    query: {
      enabled: previewerChainId !== undefined,
      staleTime: 5_000,
      refetchInterval: 600_000,
      select: applyAssetSymbol,
    },
  });

  return legacyPreviewerChainId === undefined ? current : legacy;
};
