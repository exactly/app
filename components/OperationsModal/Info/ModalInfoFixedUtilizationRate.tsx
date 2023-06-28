import React, { useCallback, useMemo, useState } from 'react';
import PieChartOutlineRoundedIcon from '@mui/icons-material/PieChartOutlineRounded';

import ModalInfo, { FromTo, Variant } from 'components/common/modal/ModalInfo';
import { Operation } from 'contexts/ModalStatusContext';
import useAccountData from 'hooks/useAccountData';
import { toPercentage } from 'utils/utils';
import usePreviewer from 'hooks/usePreviewer';
import useDelayedEffect from 'hooks/useDelayedEffect';
import { useWeb3 } from 'hooks/useWeb3';
import { Box } from '@mui/material';
import UtilizationRateWithAreaChart from 'components/charts/UtilizationRateWithAreaChart';
import { useTranslation } from 'react-i18next';
import { useMarketContext } from 'contexts/MarketContext';
import { formatEther, formatUnits, parseUnits, zeroAddress } from 'viem';

type Props = {
  qty: string;
  symbol: string;
  operation: Extract<Operation, 'depositAtMaturity' | 'withdrawAtMaturity' | 'borrowAtMaturity' | 'repayAtMaturity'>;
  variant?: Variant;
  fixedRate?: bigint;
};

function ModalInfoFixedUtilizationRate({ qty, symbol, operation, variant = 'column', fixedRate }: Props) {
  const { t } = useTranslation();
  const previewerContract = usePreviewer();
  const { walletAddress } = useWeb3();
  const { marketAccount } = useAccountData(symbol);
  const { date } = useMarketContext();

  const [rawFrom, from] = useMemo(() => {
    if (!date) return [undefined, undefined];

    const pool = marketAccount?.fixedPools?.find(({ maturity }) => maturity === BigInt(date));
    if (!pool) return [undefined, undefined];

    return [Number(formatEther(pool.utilization)), toPercentage(Number(formatEther(pool.utilization)))];
  }, [date, marketAccount]);

  const [to, setTo] = useState<string | undefined>();
  const [rawTo, setRawTo] = useState<number | undefined>();

  const preview = useCallback(
    async (cancelled: () => boolean) => {
      if (!marketAccount || !previewerContract || !date) {
        return setTo(undefined);
      }
      if (!qty) {
        setTo(from);
        setRawTo(rawFrom);
        return;
      }

      setTo(undefined);
      setRawTo(undefined);

      try {
        const initialAssets = parseUnits(qty, marketAccount.decimals);
        let uti: bigint | undefined = undefined;
        switch (operation) {
          case 'depositAtMaturity': {
            const { utilization } = await previewerContract.read.previewDepositAtMaturity([
              marketAccount.market,
              BigInt(date),
              initialAssets,
            ]);
            uti = utilization;
            break;
          }

          case 'withdrawAtMaturity': {
            const { utilization } = await previewerContract.read.previewWithdrawAtMaturity([
              marketAccount.market,
              BigInt(date),
              initialAssets,
              walletAddress ?? zeroAddress,
            ]);
            uti = utilization;
            break;
          }
          case 'borrowAtMaturity': {
            const { utilization } = await previewerContract.read.previewBorrowAtMaturity([
              marketAccount.market,
              BigInt(date),
              initialAssets,
            ]);
            uti = utilization;
            break;
          }
          case 'repayAtMaturity': {
            const { utilization } = await previewerContract.read.previewRepayAtMaturity([
              marketAccount.market,
              BigInt(date),
              initialAssets,
              walletAddress ?? zeroAddress,
            ]);
            uti = utilization;
            break;
          }
        }

        if (cancelled()) return;
        setTo(toPercentage(Number(formatUnits(uti, 18))));
        setRawTo(Number(formatUnits(uti, 18)));
      } catch {
        setTo('N/A');
        setRawTo(undefined);
      }
    },
    [date, from, marketAccount, operation, previewerContract, qty, rawFrom, walletAddress],
  );

  const { isLoading } = useDelayedEffect({ effect: preview });

  return (
    <>
      <ModalInfo label={t('Pool Utilization Rate')} icon={PieChartOutlineRoundedIcon} variant={variant}>
        <FromTo from={from} to={isLoading ? undefined : to} variant={variant} />
      </ModalInfo>
      {variant === 'row' && (
        <Box height={150} maxWidth="86vw" p={1} mx="auto">
          <UtilizationRateWithAreaChart
            type="fixed"
            operation={operation}
            symbol={symbol}
            from={rawFrom}
            to={rawTo}
            fixedRate={fixedRate}
          />
        </Box>
      )}
    </>
  );
}

export default React.memo(ModalInfoFixedUtilizationRate);
