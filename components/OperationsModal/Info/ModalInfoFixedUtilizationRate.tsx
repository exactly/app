import React, { useCallback, useMemo, useState } from 'react';
import { BigNumber, formatFixed, parseFixed } from '@ethersproject/bignumber';
import PieChartOutlineRoundedIcon from '@mui/icons-material/PieChartOutlineRounded';

import ModalInfo, { FromTo, Variant } from 'components/common/modal/ModalInfo';
import { Operation } from 'contexts/ModalStatusContext';
import useAccountData from 'hooks/useAccountData';
import { toPercentage } from 'utils/utils';
import usePreviewer from 'hooks/usePreviewer';
import useDelayedEffect from 'hooks/useDelayedEffect';
import { useWeb3 } from 'hooks/useWeb3';
import { AddressZero } from '@ethersproject/constants';
import { useOperationContext } from 'contexts/OperationContext';
import { Box } from '@mui/material';
import UtilizationRateWithAreaChart from 'components/charts/UtilizationRateWithAreaChart';
import { useTranslation } from 'react-i18next';
import { useMarketContext } from 'contexts/MarketContext';

type Props = {
  qty: string;
  symbol: string;
  operation: Extract<Operation, 'depositAtMaturity' | 'withdrawAtMaturity' | 'borrowAtMaturity' | 'repayAtMaturity'>;
  variant?: Variant;
  fixedRate?: BigNumber;
};

function ModalInfoFixedUtilizationRate({ qty, symbol, operation, variant = 'column', fixedRate }: Props) {
  const { t } = useTranslation();
  const previewerContract = usePreviewer();
  const { walletAddress } = useWeb3();
  const { marketAccount } = useAccountData(symbol);
  const { date } = useMarketContext();

  const { marketContract } = useOperationContext();

  const [rawFrom, from] = useMemo(() => {
    if (!date) return [undefined, undefined];

    const pool = marketAccount?.fixedPools?.find(({ maturity }) => maturity.toNumber() === date);
    if (!pool) return [undefined, undefined];

    return [Number(formatFixed(pool.utilization, 18)), toPercentage(Number(formatFixed(pool.utilization, 18)))];
  }, [date, marketAccount]);

  const [to, setTo] = useState<string | undefined>();
  const [rawTo, setRawTo] = useState<number | undefined>();

  const preview = useCallback(async () => {
    if (!marketAccount || !marketContract || !previewerContract || !date) {
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
      const initialAssets = parseFixed(qty, marketAccount.decimals);
      let uti: BigNumber | undefined = undefined;
      switch (operation) {
        case 'depositAtMaturity': {
          const { utilization } = await previewerContract.previewDepositAtMaturity(
            marketContract.address,
            date,
            initialAssets,
          );
          uti = utilization;
          break;
        }

        case 'withdrawAtMaturity': {
          const { utilization } = await previewerContract.previewWithdrawAtMaturity(
            marketContract.address,
            date,
            initialAssets,
            walletAddress ?? AddressZero,
          );
          uti = utilization;
          break;
        }
        case 'borrowAtMaturity': {
          const { utilization } = await previewerContract.previewBorrowAtMaturity(
            marketContract.address,
            date,
            initialAssets,
          );
          uti = utilization;
          break;
        }
        case 'repayAtMaturity': {
          const { utilization } = await previewerContract.previewRepayAtMaturity(
            marketContract.address,
            date,
            initialAssets,
            walletAddress ?? AddressZero,
          );
          uti = utilization;
          break;
        }
      }

      setTo(toPercentage(Number(formatFixed(uti, 18))));
      setRawTo(Number(formatFixed(uti, 18)));
    } catch {
      setTo('N/A');
      setRawTo(undefined);
    }
  }, [date, from, marketAccount, marketContract, operation, previewerContract, qty, rawFrom, walletAddress]);

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
