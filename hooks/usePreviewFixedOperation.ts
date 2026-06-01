import { useCallback, useState } from 'react';
import { parseUnits } from 'viem';
import { captureException } from '@sentry/nextjs';
import { WAD } from '@exactly/lib';

import { MarketsBasicOperation, MarketsBasicOption } from 'contexts/MarketsBasicContext';
import { useOperationContext } from 'contexts/OperationContext';
import dayjs from 'dayjs';
import usePreviewerExactly from './usePreviewerExactly';
import useDelayedEffect from './useDelayedEffect';
import useMaturityPools from './useMaturityPools';
import {
  legacyPreviewerAddress,
  previewerAddress,
  readLegacyPreviewerPreviewBorrowAtAllMaturities,
  readLegacyPreviewerPreviewDepositAtAllMaturities,
  readPreviewerPreviewBorrowAtAllMaturities,
  readPreviewerPreviewDepositAtAllMaturities,
} from 'generated/wagmi';
import { defaultChain, wagmi } from 'utils/client';

const MIN_OPTIONS = 3;

type PreviewFixedOperation = {
  options: MarketsBasicOption[];
  loading: boolean;
};

const legacyPreviewerChainId = Object.keys(legacyPreviewerAddress)
  .map(Number)
  .find((chainId): chainId is keyof typeof legacyPreviewerAddress => chainId === defaultChain.id);
const previewerChainId = Object.keys(previewerAddress)
  .map(Number)
  .find((chainId): chainId is keyof typeof previewerAddress => chainId === defaultChain.id);

export default (operation: MarketsBasicOperation): PreviewFixedOperation => {
  const { symbol, qty } = useOperationContext();
  const maturityPools = useMaturityPools(symbol);
  const { data } = usePreviewerExactly();
  const marketAccount = data?.find((market) => market.assetSymbol === symbol);
  const [options, setOptions] = useState<MarketsBasicOption[]>(Array(maturityPools.length || MIN_OPTIONS).fill({}));
  const [loading, setLoading] = useState<boolean>(true);

  const updateAPR = useCallback(
    async (cancelled: () => boolean) => {
      if (!marketAccount) return;

      if (!qty || parseFloat(qty) === 0) {
        if (cancelled()) return;
        setOptions(maturityPools);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const initialAssets = parseUnits(qty, marketAccount.decimals);
        const previewPools =
          legacyPreviewerChainId !== undefined
            ? operation === 'deposit'
              ? await readLegacyPreviewerPreviewDepositAtAllMaturities(wagmi, {
                  chainId: legacyPreviewerChainId,
                  args: [marketAccount.market, initialAssets],
                })
              : await readLegacyPreviewerPreviewBorrowAtAllMaturities(wagmi, {
                  chainId: legacyPreviewerChainId,
                  args: [marketAccount.market, initialAssets],
                })
            : previewerChainId !== undefined
              ? operation === 'deposit'
                ? await readPreviewerPreviewDepositAtAllMaturities(wagmi, {
                    chainId: previewerChainId,
                    args: [marketAccount.market, initialAssets],
                  })
                : await readPreviewerPreviewBorrowAtAllMaturities(wagmi, {
                    chainId: previewerChainId,
                    args: [marketAccount.market, initialAssets],
                  })
              : undefined;
        if (!previewPools) return;
        const currentTimestamp = BigInt(dayjs().unix());

        const fixedOptions: MarketsBasicOption[] = previewPools.map(({ maturity, assets }) => {
          const rate = (assets * WAD) / initialAssets;
          const fixedAPR = Number(((rate - WAD) * 31_536_000n) / (maturity - currentTimestamp)) / 1e18;

          return {
            maturity,
            depositAPR: fixedAPR,
            borrowAPR: fixedAPR,
            interest: assets - initialAssets,
            finalAssets: assets,
          };
        });

        if (cancelled()) return;
        setOptions(fixedOptions);
      } catch (error) {
        captureException(error);
        if (cancelled()) return;
        setOptions(Array(maturityPools.length || MIN_OPTIONS).fill({}));
      } finally {
        setLoading(false);
      }
    },
    [marketAccount, qty, maturityPools, operation],
  );

  const { isLoading: delayedLoading } = useDelayedEffect({ effect: updateAPR });

  return { options, loading: loading || delayedLoading };
};
