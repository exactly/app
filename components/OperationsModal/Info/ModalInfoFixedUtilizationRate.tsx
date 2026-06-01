import React, { useCallback, useMemo, useState } from 'react';
import PieChartOutlineRoundedIcon from '@mui/icons-material/PieChartOutlineRounded';

import ModalInfo, { FromTo, Variant } from 'components/common/modal/ModalInfo';
import type { Operation } from 'types/Operation';
import usePreviewerExactly from 'hooks/usePreviewerExactly';
import { toPercentage } from 'utils/utils';
import useDelayedEffect from 'hooks/useDelayedEffect';
import { useTranslation } from 'react-i18next';
import { formatEther, formatUnits, parseUnits, zeroAddress } from 'viem';
import { useOperationContext } from 'contexts/OperationContext';
import {
  legacyPreviewerAddress,
  previewerAddress,
  readLegacyPreviewerPreviewBorrowAtMaturity,
  readLegacyPreviewerPreviewDepositAtMaturity,
  readLegacyPreviewerPreviewRepayAtMaturity,
  readLegacyPreviewerPreviewWithdrawAtMaturity,
  readPreviewerPreviewBorrowAtMaturity,
  readPreviewerPreviewDepositAtMaturity,
  readPreviewerPreviewRepayAtMaturity,
  readPreviewerPreviewWithdrawAtMaturity,
} from 'generated/wagmi';
import { defaultChain, wagmi } from 'utils/client';
import useReadOnly from 'hooks/useReadOnly';

type Props = {
  qty: string;
  symbol: string;
  operation: Extract<Operation, 'depositAtMaturity' | 'withdrawAtMaturity' | 'borrowAtMaturity' | 'repayAtMaturity'>;
  variant?: Variant;
};

const legacyPreviewerChainId = Object.keys(legacyPreviewerAddress)
  .map(Number)
  .find((chainId): chainId is keyof typeof legacyPreviewerAddress => chainId === defaultChain.id);
const previewerChainId = Object.keys(previewerAddress)
  .map(Number)
  .find((chainId): chainId is keyof typeof previewerAddress => chainId === defaultChain.id);

function ModalInfoFixedUtilizationRate({ qty, symbol, operation, variant = 'column' }: Props) {
  const { t } = useTranslation();
  const { account: walletAddress } = useReadOnly();
  const { data } = usePreviewerExactly();
  const marketAccount = data?.find((market) => market.assetSymbol === symbol);
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
      if (!marketAccount || !date) {
        return setTo(undefined);
      }
      if (!qty) {
        setTo(from);
        return;
      }

      setTo(undefined);

      try {
        const initialAssets = parseUnits(qty, marketAccount.decimals);
        if (legacyPreviewerChainId === undefined && previewerChainId === undefined) return setTo('N/A');
        let uti: bigint | undefined = undefined;
        switch (operation) {
          case 'depositAtMaturity': {
            if (legacyPreviewerChainId !== undefined) {
              ({ utilization: uti } = await readLegacyPreviewerPreviewDepositAtMaturity(wagmi, {
                chainId: legacyPreviewerChainId,
                args: [marketAccount.market, date, initialAssets],
              }));
            } else if (previewerChainId !== undefined) {
              ({ utilization: uti } = await readPreviewerPreviewDepositAtMaturity(wagmi, {
                chainId: previewerChainId,
                args: [marketAccount.market, date, initialAssets],
              }));
            }
            break;
          }

          case 'withdrawAtMaturity': {
            const args = [marketAccount.market, date, initialAssets, walletAddress ?? zeroAddress] as const;
            if (legacyPreviewerChainId !== undefined) {
              ({ utilization: uti } = await readLegacyPreviewerPreviewWithdrawAtMaturity(wagmi, {
                chainId: legacyPreviewerChainId,
                args,
              }));
            } else if (previewerChainId !== undefined) {
              ({ utilization: uti } = await readPreviewerPreviewWithdrawAtMaturity(wagmi, {
                chainId: previewerChainId,
                args,
              }));
            }
            break;
          }
          case 'borrowAtMaturity': {
            if (legacyPreviewerChainId !== undefined) {
              ({ utilization: uti } = await readLegacyPreviewerPreviewBorrowAtMaturity(wagmi, {
                chainId: legacyPreviewerChainId,
                args: [marketAccount.market, date, initialAssets],
              }));
            } else if (previewerChainId !== undefined) {
              ({ utilization: uti } = await readPreviewerPreviewBorrowAtMaturity(wagmi, {
                chainId: previewerChainId,
                args: [marketAccount.market, date, initialAssets],
              }));
            }
            break;
          }
          case 'repayAtMaturity': {
            const args = [marketAccount.market, date, initialAssets, walletAddress ?? zeroAddress] as const;
            if (legacyPreviewerChainId !== undefined) {
              ({ utilization: uti } = await readLegacyPreviewerPreviewRepayAtMaturity(wagmi, {
                chainId: legacyPreviewerChainId,
                args,
              }));
            } else if (previewerChainId !== undefined) {
              ({ utilization: uti } = await readPreviewerPreviewRepayAtMaturity(wagmi, {
                chainId: previewerChainId,
                args,
              }));
            }
            break;
          }
        }

        if (cancelled()) return;
        if (uti === undefined) return setTo('N/A');
        setTo(toPercentage(Number(formatUnits(uti, 18))));
      } catch {
        setTo('N/A');
      }
    },
    [date, from, marketAccount, operation, qty, walletAddress],
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
