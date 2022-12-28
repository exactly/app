import React, { useCallback, useContext, useMemo, useState } from 'react';
import { BigNumber, formatFixed, parseFixed } from '@ethersproject/bignumber';
import PieChartOutlineRoundedIcon from '@mui/icons-material/PieChartOutlineRounded';

import ModalInfo, { FromTo, Variant } from 'components/common/modal/ModalInfo';
import { Operation } from 'contexts/ModalStatusContext';
import useAccountData from 'hooks/useAccountData';
import { toPercentage } from 'utils/utils';
import { MarketContext } from 'contexts/MarketContext';
import usePreviewer from 'hooks/usePreviewer';
import useDelayedEffect from 'hooks/useDelayedEffect';
import useMarket from 'hooks/useMarket';

type Props = {
  qty: string;
  symbol: string;
  operation: Extract<Operation, 'depositAtMaturity' | 'withdrawAtMaturity' | 'borrowAtMaturity' | 'repayAtMaturity'>;
  variant?: Variant;
};

function ModalInfoFixedUtilizationRate({ qty, symbol, operation, variant = 'column' }: Props) {
  const previewerContract = usePreviewer();
  const { fixedPools, usdPrice, decimals } = useAccountData(symbol);
  const { date, market } = useContext(MarketContext);

  const marketContract = useMarket(market);

  const from: string | undefined = useMemo(() => {
    if (!date) return;

    const pool = fixedPools?.find(({ maturity }) => maturity.toString() === date);
    if (!pool) return;

    return toPercentage(Number(formatFixed(pool.utilization, 18)) * 100);
  }, [date, fixedPools]);

  const [to, setTo] = useState<string | undefined>();

  const preview = useCallback(async () => {
    if (!marketContract || !previewerContract || !date || !decimals || !usdPrice) {
      return setTo(undefined);
    }
    if (!qty) {
      return setTo(from);
    }

    setTo(undefined);

    try {
      const initialAssets = parseFixed(qty, decimals);
      let uti: BigNumber | undefined = undefined;
      switch (operation) {
        case 'depositAtMaturity':
          {
            const { utilization } = await previewerContract.previewDepositAtMaturity(
              marketContract.address,
              date,
              initialAssets,
            );
            uti = utilization;
          }
          break;

        case 'withdrawAtMaturity':
          // TODO(jg): Previewer contract misses this call. ADD WHEN READY
          break;
        case 'borrowAtMaturity':
          {
            const { utilization } = await previewerContract.previewBorrowAtMaturity(
              marketContract.address,
              date,
              initialAssets,
            );
            uti = utilization;
          }
          break;
        case 'repayAtMaturity':
          // TODO(jg): Previewer contract misses this call. ADD WHEN READY
          break;
      }

      if (uti) {
        setTo(toPercentage(Number(formatFixed(uti, 18)) * 100));
      }
    } catch {
      setTo('N/A');
    }
  }, [date, decimals, from, marketContract, operation, previewerContract, qty, usdPrice]);

  const { isLoading } = useDelayedEffect({ effect: preview });

  return (
    <ModalInfo label="Pool Utilization Rate" icon={PieChartOutlineRoundedIcon} variant={variant}>
      <FromTo from={from} to={isLoading ? undefined : to} variant={variant} />
    </ModalInfo>
  );
}

export default React.memo(ModalInfoFixedUtilizationRate);
