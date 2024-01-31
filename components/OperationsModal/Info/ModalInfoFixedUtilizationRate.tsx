import React, { useCallback, useMemo, useState } from 'react';
import PieChartOutlineRoundedIcon from '@mui/icons-material/PieChartOutlineRounded';

import ModalInfo, { FromTo, Variant } from 'components/common/modal/ModalInfo';
import type { Operation } from 'types/Operation';
import useAccountData from 'hooks/useAccountData';
import { toPercentage } from 'utils/utils';
import usePreviewer from 'hooks/usePreviewer';
import useDelayedEffect from 'hooks/useDelayedEffect';
import { useWeb3 } from 'hooks/useWeb3';
import { useTranslation } from 'react-i18next';
import { formatEther, formatUnits, parseUnits, zeroAddress } from 'viem';
import { useOperationContext } from 'contexts/OperationContext';

type Props = {
  qty: string;
  symbol: string;
  operation: Extract<Operation, 'depositAtMaturity' | 'withdrawAtMaturity' | 'borrowAtMaturity' | 'repayAtMaturity'>;
  variant?: Variant;
};

function ModalInfoFixedUtilizationRate({ qty, symbol, operation, variant = 'column' }: Props) {
  const { t } = useTranslation();
  const previewerContract = usePreviewer();
  const { walletAddress } = useWeb3();
  const { marketAccount } = useAccountData(symbol);
  const { date } = useOperationContext();

  const from = useMemo(() => {
    if (!date) return undefined;

    const pool = marketAccount?.fixedPools?.find(({ maturity }) => maturity === date);
    if (!pool) return undefined;

    return toPercentage(Number(formatEther(pool.utilization)));
  }, [date, marketAccount]);

  const [to, setTo] = useState<string | undefined>();

  const preview = useCallback(
    async (cancelled: () => boolean) => {
      if (!marketAccount || !previewerContract || !date) {
        return setTo(undefined);
      }
      if (!qty) {
        setTo(from);
        return;
      }

      setTo(undefined);

      try {
        const initialAssets = parseUnits(qty, marketAccount.decimals);
        let uti: bigint | undefined = undefined;
        switch (operation) {
          case 'depositAtMaturity': {
            const { utilization } = await previewerContract.read.previewDepositAtMaturity([
              marketAccount.market,
              date,
              initialAssets,
            ]);
            uti = utilization;
            break;
          }

          case 'withdrawAtMaturity': {
            const { utilization } = await previewerContract.read.previewWithdrawAtMaturity([
              marketAccount.market,
              date,
              initialAssets,
              walletAddress ?? zeroAddress,
            ]);
            uti = utilization;
            break;
          }
          case 'borrowAtMaturity': {
            const { utilization } = await previewerContract.read.previewBorrowAtMaturity([
              marketAccount.market,
              date,
              initialAssets,
            ]);
            uti = utilization;
            break;
          }
          case 'repayAtMaturity': {
            const { utilization } = await previewerContract.read.previewRepayAtMaturity([
              marketAccount.market,
              date,
              initialAssets,
              walletAddress ?? zeroAddress,
            ]);
            uti = utilization;
            break;
          }
        }

        if (cancelled()) return;
        setTo(toPercentage(Number(formatUnits(uti, 18))));
      } catch {
        setTo('N/A');
      }
    },
    [date, from, marketAccount, operation, previewerContract, qty, walletAddress],
  );

  const { isLoading } = useDelayedEffect({ effect: preview });

  return (
    <>
      <ModalInfo label={t('Pool Utilization Rate')} icon={PieChartOutlineRoundedIcon} variant={variant}>
        <FromTo from={from} to={isLoading ? undefined : to} variant={variant} />
      </ModalInfo>
    </>
  );
}

export default React.memo(ModalInfoFixedUtilizationRate);
