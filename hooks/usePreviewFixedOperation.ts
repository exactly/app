import { parseFixed } from '@ethersproject/bignumber';
import { WeiPerEther } from '@ethersproject/constants';
import { captureException } from '@sentry/nextjs';
import { MarketsBasicOperation, MarketsBasicOption } from 'contexts/MarketsBasicContext';
import { useOperationContext } from 'contexts/OperationContext';
import { useCallback, useState } from 'react';
import useAccountData from './useAccountData';
import useDelayedEffect from './useDelayedEffect';
import useMaturityPools from './useMaturityPools';
import usePreviewer from './usePreviewer';

const MIN_OPTIONS = 3;

type PreviewFixedOperation = {
  options: MarketsBasicOption[];
  loading: boolean;
};

export default (operation: MarketsBasicOperation): PreviewFixedOperation => {
  const previewerContract = usePreviewer();
  const { symbol, qty } = useOperationContext();
  const maturityPools = useMaturityPools(symbol);
  const { marketAccount } = useAccountData(symbol);
  const [options, setOptions] = useState<MarketsBasicOption[]>(Array(maturityPools.length || MIN_OPTIONS).fill({}));
  const [loading, setLoading] = useState<boolean>(true);

  const updateAPR = useCallback(
    async (cancelled: () => boolean) => {
      if (!marketAccount || !previewerContract) return;

      if (!qty || parseFloat(qty) === 0) {
        if (cancelled()) return;
        setOptions(maturityPools);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const initialAssets = parseFixed(qty, marketAccount.decimals);

        const preview =
          operation === 'deposit'
            ? previewerContract.previewDepositAtAllMaturities
            : previewerContract.previewBorrowAtAllMaturities;
        const previewPools = await preview(marketAccount.market, initialAssets);
        const currentTimestamp = Math.floor(Date.now() / 1000);

        const fixedOptions: MarketsBasicOption[] = previewPools.map(({ maturity, assets }) => {
          const rate = assets.mul(WeiPerEther).div(initialAssets);
          const fixedAPR = Number(rate.sub(WeiPerEther).mul(31_536_000).div(maturity.sub(currentTimestamp))) / 1e18;

          return {
            maturity: maturity.toNumber(),
            depositAPR: fixedAPR,
            borrowAPR: fixedAPR,
            interest: assets.sub(initialAssets),
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
    [marketAccount, previewerContract, qty, maturityPools, operation],
  );

  const { isLoading: delayedLoading } = useDelayedEffect({ effect: updateAPR });

  return { options, loading: loading || delayedLoading };
};
