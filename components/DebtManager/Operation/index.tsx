import React, { useCallback, useMemo, useRef, useState } from 'react';
import { Box, Typography } from '@mui/material';
import { LoadingButton } from '@mui/lab';
import { useTranslation } from 'react-i18next';
import { WeiPerEther, Zero } from '@ethersproject/constants';
import { formatFixed } from '@ethersproject/bignumber';
import ArrowForwardRoundedIcon from '@mui/icons-material/ArrowForwardRounded';

import { ModalBox, ModalBoxRow } from 'components/common/modal/ModalBox';
import ModalInfo from 'components/common/modal/ModalInfo';
import ModalAdvancedSettings from 'components/common/modal/ModalAdvancedSettings';
import ModalSheet from 'components/common/modal/ModalSheet';
import CustomSlider from 'components/common/CustomSlider';
import PositionTable, { PositionTableRow } from '../PositionTable';
import useAccountData from 'hooks/useAccountData';
import formatNumber from 'utils/formatNumber';
import { useDebtManagerContext } from 'contexts/DebtManagerContext';
import parseTimestamp from 'utils/parseTimestamp';
import ModalSheetButton from 'components/common/modal/ModalSheetButton';

function Operation() {
  const { accountData, getMarketAccount } = useAccountData();
  const { t } = useTranslation();
  const [[fromSheetOpen, toSheetOpen], setSheetOpen] = useState([false, false]);
  const container = useRef<HTMLDivElement>(null);
  const fromSheetRef = useRef<HTMLDivElement>(null);
  const toSheetRef = useRef<HTMLDivElement>(null);

  const { input, setTo, setFrom, setPercent } = useDebtManagerContext();

  const onClose = useCallback(() => setSheetOpen([false, false]), []);

  const fromRows = useMemo<PositionTableRow[]>(() => {
    if (!accountData) {
      return [];
    }
    return accountData.flatMap((entry) => {
      const { assetSymbol, decimals, usdPrice, floatingBorrowRate, floatingBorrowAssets, fixedBorrowPositions } = entry;
      return [
        ...(entry.floatingBorrowAssets.gt(Zero)
          ? [
              {
                symbol: assetSymbol,
                balance:
                  '$' +
                  formatNumber(formatFixed(floatingBorrowAssets.mul(usdPrice).div(WeiPerEther), decimals), 'USD', true),
                apr: floatingBorrowRate,
              },
            ]
          : []),
        ...fixedBorrowPositions.map((position) => ({
          symbol: assetSymbol,
          maturity: Number(position.maturity),
          balance:
            '$' +
            formatNumber(formatFixed(position.previewValue.mul(usdPrice).div(WeiPerEther), decimals), 'USD', true),
          // TODO: Calculate FixedBorrow APR
          apr: Zero,
        })),
      ];
    });
  }, [accountData]);

  const toRows = useMemo<PositionTableRow[]>(() => {
    if (!input.from) {
      return [];
    }

    const marketAccount = getMarketAccount(input.from.symbol);

    if (!marketAccount) {
      return [];
    }

    const { assetSymbol, floatingBorrowRate, fixedPools } = marketAccount;
    return [
      {
        symbol: assetSymbol,
        apr: floatingBorrowRate,
      },
      ...fixedPools.map((pool) => ({
        symbol: assetSymbol,
        maturity: Number(pool.maturity),
        // TODO: Calculate FixedBorrow APR
        apr: Zero,
      })),
    ];
  }, [input.from, getMarketAccount]);

  return (
    <>
      <ModalSheet
        ref={fromSheetRef}
        container={container.current}
        open={fromSheetOpen}
        onClose={onClose}
        title={t('Select Current Position')}
      >
        <PositionTable
          data={fromRows}
          onClick={({ symbol, maturity }) => {
            setFrom({ symbol, maturity });
            setSheetOpen([false, false]);
          }}
        />
      </ModalSheet>
      <ModalSheet
        ref={toSheetRef}
        container={container.current}
        open={toSheetOpen}
        onClose={onClose}
        title={t('Select New Position')}
      >
        <CustomSlider value={input.percent} onChange={(e, value) => typeof value === 'number' && setPercent(value)} />
        <PositionTable
          data={toRows}
          onClick={({ symbol, maturity }) => {
            setTo({ symbol, maturity });
            setSheetOpen([false, false]);
          }}
        />
      </ModalSheet>
      <Box
        ref={container}
        sx={{
          height: fromSheetOpen
            ? fromSheetRef.current?.clientHeight
            : toSheetOpen
            ? toSheetRef.current?.clientHeight
            : 'auto',
        }}
      >
        <ModalBox sx={{ p: 2, mb: 4 }}>
          <ModalBoxRow display="flex" flexDirection="column" alignItems="stretch">
            <Typography variant="caption" color="figma.grey.600" mb={2}>
              {t('Select Debt To Rollover')}
            </Typography>
            <Box display="flex" justifyContent="space-between" alignItems="center">
              <ModalSheetButton selected={Boolean(input.from)} onClick={() => setSheetOpen([true, false])}>
                {input.from
                  ? input.from.maturity
                    ? parseTimestamp(input.from.maturity)
                    : t('Unlimited')
                  : t('Current Position')}
              </ModalSheetButton>
              <ArrowForwardRoundedIcon sx={{ color: 'blue', fontSize: 14 }} />
              <ModalSheetButton
                selected={Boolean(input.to)}
                onClick={() => setSheetOpen([false, true])}
                disabled={!input.from}
              >
                {input.to
                  ? input.to.maturity
                    ? parseTimestamp(input.to.maturity)
                    : t('Unlimited')
                  : t('New position')}
              </ModalSheetButton>
            </Box>
          </ModalBoxRow>
        </ModalBox>
        <ModalInfo variant="row" label={t('TX Cost')}>
          xd
        </ModalInfo>
        <ModalAdvancedSettings mt={-1} mb={4}>
          HEHE
        </ModalAdvancedSettings>
        <LoadingButton disabled={true} fullWidth variant="contained">
          {t('Refinance your loan')}
        </LoadingButton>
      </Box>
    </>
  );
}

export default React.memo(Operation);
