import { useCallback, useState } from 'react';
import { parseUnits } from 'viem';
import { captureException } from '@sentry/nextjs';
import { MarketsBasicOperation, MarketsBasicOption } from 'contexts/MarketsBasicContext';
import { useOperationContext } from 'contexts/OperationContext';
import dayjs from 'dayjs';
import { WEI_PER_ETHER } from 'utils/const';
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
        const initialAssets = parseUnits(qty, marketAccount.decimals);

        const preview =
          operation === 'deposit'
            ? previewerContract.read.previewDepositAtAllMaturities
            : previewerContract.read.previewBorrowAtAllMaturities;
        const previewPools = await preview([marketAccount.market, initialAssets]);
        const currentTimestamp = BigInt(dayjs().unix());

        const fixedOptions: MarketsBasicOption[] = previewPools.map(({ maturity, assets }) => {
          const rate = (assets * WEI_PER_ETHER) / initialAssets;
          const fixedAPR = Number(((rate - WEI_PER_ETHER) * 31_536_000n) / (maturity - currentTimestamp)) / 1e18;

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
    [marketAccount, previewerContract, qty, maturityPools, operation],
  );

  const { isLoading: delayedLoading } = useDelayedEffect({ effect: updateAPR });

  return { options, loading: loading || delayedLoading };
};
