import { formatFixed, parseFixed } from '@ethersproject/bignumber';
import { WeiPerEther } from '@ethersproject/constants';
import { captureException } from '@sentry/nextjs';
import AccountDataContext from 'contexts/AccountDataContext';
import { MarketsBasicOperation, MarketsBasicOption } from 'contexts/MarketsBasicContext';
import { useOperationContext } from 'contexts/OperationContext';
import { useCallback, useContext, useState } from 'react';
import useAccountData from './useAccountData';
import useDelayedEffect from './useDelayedEffect';
import useMaturityPools from './useMaturityPools';
import usePreviewer from './usePreviewer';

const MIN_OPTIONS = 3;
const MAX_APR = 200;

type PreviewFixedOperation = {
  options: MarketsBasicOption[];
  loading: boolean;
};

export default (operation: MarketsBasicOperation): PreviewFixedOperation => {
  const { accountData } = useContext(AccountDataContext);
  const previewerContract = usePreviewer();
  const { symbol, qty, marketContract } = useOperationContext();
  const maturityPools = useMaturityPools(symbol);
  const { decimals = 18 } = useAccountData(symbol);
  const [options, setOptions] = useState<MarketsBasicOption[]>(Array(maturityPools.length || MIN_OPTIONS).fill({}));
  const [loading, setLoading] = useState<boolean>(true);

  const updateAPR = useCallback(
    async (cancelled: () => boolean) => {
      if (!accountData || !previewerContract || !marketContract) return;

      if (!qty || parseFloat(qty) === 0) {
        setOptions([...maturityPools]);
        return;
      }

      try {
        setLoading(true);
        const initialAssets = parseFixed(qty, decimals);

        const preview =
          operation === 'deposit'
            ? previewerContract.previewDepositAtAllMaturities
            : previewerContract.previewBorrowAtAllMaturities;
        const previewPools = await preview(marketContract.address, initialAssets);

        const currentTimestamp = Date.now() / 1000;

        const fixedOptions: MarketsBasicOption[] = previewPools.map(({ maturity, assets }) => {
          const time = 31_536_000 / (maturity.toNumber() - currentTimestamp);
          const rate = assets.mul(WeiPerEther).div(initialAssets);
          const fixedAPR = (Number(formatFixed(rate, 18)) - 1) * time;

          return {
            maturity: maturity.toNumber(),
            depositAPR: Math.min(fixedAPR, MAX_APR),
            borrowAPR: Math.min(fixedAPR, MAX_APR),
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
    [accountData, previewerContract, marketContract, qty, decimals, maturityPools, operation],
  );

  const { isLoading: delayedLoading } = useDelayedEffect({ effect: updateAPR });

  return { options, loading: loading || delayedLoading };
};
