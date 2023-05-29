import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Box, Typography } from '@mui/material';
import { LoadingButton } from '@mui/lab';
import { useTranslation } from 'react-i18next';
import { One, WeiPerEther, Zero } from '@ethersproject/constants';
import ArrowForwardRoundedIcon from '@mui/icons-material/ArrowForwardRounded';
import { BigNumber, formatFixed, parseFixed } from '@ethersproject/bignumber';
import dayjs from 'dayjs';

import { ModalBox, ModalBoxRow } from 'components/common/modal/ModalBox';
import ModalAdvancedSettings from 'components/common/modal/ModalAdvancedSettings';
import ModalSheet from 'components/common/modal/ModalSheet';
import CustomSlider from 'components/common/CustomSlider';
import useAccountData from 'hooks/useAccountData';
import { useDebtManagerContext } from 'contexts/DebtManagerContext';
import parseTimestamp from 'utils/parseTimestamp';
import ModalSheetButton from 'components/common/modal/ModalSheetButton';
import formatNumber from 'utils/formatNumber';
import usePreviewer from 'hooks/usePreviewer';
import useGraphClient from 'hooks/useGraphClient';
import useDelayedEffect from 'hooks/useDelayedEffect';
import PositionTable, { PositionTableRow } from '../PositionTable';
import { useWeb3 } from 'hooks/useWeb3';
import Overview from '../Overview';
import { calculateAPR } from 'utils/calculateAPR';
import { Borrow } from 'types/Borrow';

import getAllBorrowsAtMaturity from 'queries/getAllBorrowsAtMaturity';
import ModalInfoEditableSlippage from 'components/OperationsModal/Info/ModalInfoEditableSlippage';
import ModalTxCost from 'components/OperationsModal/ModalTxCost';
import handleOperationError from 'utils/handleOperationError';
import ModalAlert from 'components/common/modal/ModalAlert';

function Operation() {
  const { t } = useTranslation();
  const { accountData, getMarketAccount } = useAccountData();
  const { walletAddress } = useWeb3();
  const [[fromSheetOpen, toSheetOpen], setSheetOpen] = useState([false, false]);
  const container = useRef<HTMLDivElement>(null);
  const fromSheetRef = useRef<HTMLDivElement>(null);
  const toSheetRef = useRef<HTMLDivElement>(null);

  const request = useGraphClient();

  const {
    input,
    setTo,
    setFrom,
    setPercent,
    setSlippage,
    debtManager,
    market: marketContract,
    setGasCost,
    gasCost,
    errorData,
    setErrorData,
    isLoading,
    needsApproval,
    approve,
    estimateTx,
    submit,
  } = useDebtManagerContext();

  const onClose = useCallback(() => setSheetOpen([false, false]), []);

  const previewerContract = usePreviewer();

  const [fromRows, setFromRows] = useState<PositionTableRow[]>([]);
  const [toRows, setToRows] = useState<PositionTableRow[]>([]);

  const updateFromRows = useCallback(async () => {
    if (!accountData || !walletAddress) {
      return;
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const data = await request<any>(getAllBorrowsAtMaturity(walletAddress));
    if (!data) return;

    const borrows: Borrow[] = data.borrowAtMaturities.map(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ({ id, market, maturity, receiver, borrower, assets, fee, timestamp }: any): Borrow => ({
        id,
        market,
        maturity: parseFloat(maturity),
        assets: parseFixed(assets),
        fee: parseFixed(fee),
        receiver,
        borrower,
        timestamp,
      }),
    );

    const apr = (symbol: string, market: string, maturity: number): BigNumber => {
      const marketAccount = getMarketAccount(symbol);
      if (!marketAccount) return Zero;

      const filtered = borrows.filter(
        (borrow) => borrow.market.toLowerCase() === market.toLowerCase() && borrow.maturity === maturity,
      );

      const [allProportionalAssets, allAssets] = filtered.reduce(
        ([aprAmounts, assets], borrow) => {
          const transactionAPR = calculateAPR(borrow.fee, borrow.assets, borrow.timestamp, borrow.maturity);
          const proportionalAssets = transactionAPR.mul(borrow.assets).div(WeiPerEther);

          return [aprAmounts.add(proportionalAssets), assets.add(borrow.assets)];
        },
        [Zero, Zero],
      );

      if (allAssets.isZero()) return Zero;

      return allProportionalAssets.mul(WeiPerEther).div(allAssets);
    };

    setFromRows(
      accountData.flatMap((entry) => {
        const {
          assetSymbol,
          market,
          decimals,
          usdPrice,
          floatingBorrowRate,
          floatingBorrowAssets,
          fixedBorrowPositions,
        } = entry;
        return [
          ...(entry.floatingBorrowAssets.gt(Zero)
            ? [
                {
                  symbol: assetSymbol,
                  balance: floatingBorrowAssets,
                  apr: floatingBorrowRate,
                  usdPrice,
                  decimals,
                },
              ]
            : []),
          ...fixedBorrowPositions.map((position) => ({
            symbol: assetSymbol,
            maturity: Number(position.maturity),
            balance: position.previewValue,
            usdPrice,
            decimals,
            apr: apr(assetSymbol, market, Number(position.maturity)),
          })),
        ];
      }),
    );
  }, [accountData, walletAddress, request, getMarketAccount]);

  useEffect(() => {
    updateFromRows();
  }, [updateFromRows]);

  const updateToRows = useCallback(
    async (cancelled: () => boolean) => {
      if (!previewerContract || !input.from) return;

      const marketAccount = getMarketAccount(input.from.symbol);
      if (!marketAccount) return;

      const { floatingBorrowRate, usdPrice, assetSymbol, decimals } = marketAccount;

      const fromRow = fromRows.find((r) => r.symbol === input.from?.symbol && r.maturity === input.from?.maturity);
      if (!fromRow) {
        return;
      }

      const initialAssets = fromRow.balance?.mul(input.percent).div(100);
      if (!initialAssets) {
        return;
      }

      try {
        const previewPools = await previewerContract.previewBorrowAtAllMaturities(marketAccount.market, initialAssets);
        const currentTimestamp = dayjs().unix();

        const fixedOptions: PositionTableRow[] = previewPools.map(({ maturity, assets }) => {
          const rate = assets.mul(WeiPerEther).div(initialAssets);
          const fixedAPR = rate.sub(WeiPerEther).mul(31_536_000).div(maturity.sub(currentTimestamp));

          return {
            symbol: assetSymbol,
            maturity: Number(maturity),
            usdPrice: usdPrice,
            balance: assets,
            decimals: decimals,
            apr: fixedAPR,
          };
        });

        const fromMaturity = input.from.maturity;
        const options: PositionTableRow[] = [
          {
            symbol: assetSymbol,
            apr: floatingBorrowRate,
            usdPrice,
            decimals,
          },
          ...fixedOptions,
        ].filter((opt) => opt.maturity !== fromMaturity);

        const bestAPR = Math.min(...options.map((opt) => Number(opt.apr) / 1e18));
        const bestOption = [...options].reverse().find((opt) => Number(opt.apr) / 1e18 === bestAPR);

        if (cancelled()) return;

        setToRows(
          options.map((opt) => ({
            ...opt,
            isBest: opt?.maturity === bestOption?.maturity,
          })),
        );
      } catch (error) {
        if (cancelled()) return;
        setToRows([]);
      }
    },
    [previewerContract, input.from, input.percent, getMarketAccount, fromRows],
  );

  const { isLoading: loadingToRows } = useDelayedEffect({ effect: updateToRows });

  const usdAmount = useMemo(() => {
    const row = fromRows.find((r) => r.symbol === input.from?.symbol && r.maturity === input.from?.maturity);
    if (!row) {
      return '';
    }

    return formatNumber(
      formatFixed(row.balance?.mul(row.usdPrice).div(WeiPerEther).mul(input.percent).div(100) || Zero, row.decimals),
      'USD',
      true,
    );
  }, [input.from, input.percent, fromRows]);

  const [fromRow, toRow] = useMemo<[PositionTableRow | undefined, PositionTableRow | undefined]>(
    () => [
      fromRows.find((row) => input.from?.symbol === row.symbol && input.from?.maturity === row.maturity),
      toRows.find((row) => input.to?.symbol === row.symbol && input.to?.maturity === row.maturity),
    ],
    [input.from, input.to, fromRows, toRows],
  );

  const [maxRepayAssets, maxBorrowAssets] = useMemo(() => {
    const raw = input.slippage || '0';
    const slippage = WeiPerEther.add(parseFixed(raw, 18).div(100));

    const ret: [BigNumber, BigNumber] = [Zero, Zero];
    if (!fromRow || !toRow) {
      return ret;
    }

    const fromBalance = fromRow.balance?.mul(input.percent).div(100) ?? Zero;

    if (fromRow.maturity) {
      ret[0] = fromBalance.mul(slippage).div(WeiPerEther);
    } else {
      ret[0] = fromBalance;
    }

    if (toRow.maturity) {
      ret[1] = toRow.balance?.mul(slippage).div(WeiPerEther) ?? Zero;
    } else {
      ret[1] = fromBalance;
    }

    return ret;
  }, [input.slippage, input.percent, fromRow, toRow]);

  const [requiresApproval, setRequiresApproval] = useState(false);

  const populateTransaction = useCallback(() => {
    if (!debtManager || !marketContract || !input.from || !input.to) return;

    const percentage = BigNumber.from(input.percent).mul(WeiPerEther).div(100);

    if (!input.from.maturity || !input.to.maturity) {
      const floatingToFixed = Boolean(input.to.maturity);
      const maturity = input.to.maturity ? input.to.maturity : input.from.maturity ? input.from.maturity : 0;
      const maxAssets = floatingToFixed ? maxBorrowAssets : maxRepayAssets;
      return debtManager.populateTransaction.floatingRoll(
        marketContract.address,
        floatingToFixed,
        maturity,
        maxAssets,
        percentage,
      );
    } else {
      return debtManager.populateTransaction.fixedRoll(
        marketContract.address,
        input.from.maturity,
        input.to.maturity,
        maxRepayAssets,
        maxBorrowAssets,
        percentage,
      );
    }
  }, [debtManager, input.from, input.percent, input.to, marketContract, maxBorrowAssets, maxRepayAssets]);

  const load = useCallback(async () => {
    try {
      setErrorData(undefined);
      setGasCost(undefined);

      const approvalRequired = await needsApproval(maxBorrowAssets);
      setRequiresApproval(approvalRequired);
      if (approvalRequired) return;

      const transaction = await populateTransaction();
      if (!transaction) return;
      setGasCost(await estimateTx(transaction));
    } catch (e: unknown) {
      setErrorData({ status: true, message: handleOperationError(e) });
    }
  }, [estimateTx, maxBorrowAssets, needsApproval, populateTransaction, setGasCost, setErrorData]);

  const { isLoading: loadingStatus } = useDelayedEffect({ effect: load });

  const rollover = useCallback(async () => {
    const transaction = await populateTransaction();
    if (!transaction) return;
    return submit(transaction);
  }, [populateTransaction, submit]);

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
          loading={fromRows.length === 0}
          data={fromRows}
          showBalance
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
        <Box display="flex" justifyContent="space-between">
          <Typography variant="caption" color="figma.grey.600">
            {t('Amount To Rollover')}
          </Typography>
          <Typography variant="caption" color="figma.grey.600">
            ${usdAmount}
          </Typography>
        </Box>
        <CustomSlider pt={2} value={input.percent} onChange={setPercent} mb={4} />
        <PositionTable
          loading={loadingToRows}
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
        <ModalBox sx={{ p: 2 }}>
          <ModalBoxRow display="flex" flexDirection="column" alignItems="stretch">
            <Typography variant="caption" color="figma.grey.600" mb={2}>
              {t('Select Debt To Rollover')}
            </Typography>
            <Box display="flex" justifyContent="space-between" alignItems="center">
              <ModalSheetButton
                selected={Boolean(input.from)}
                onClick={() => setSheetOpen([true, false])}
                sx={{ ml: -0.5 }}
              >
                {input.from
                  ? input.from.maturity
                    ? parseTimestamp(input.from.maturity)
                    : t('Unlimited')
                  : t('Current Position')}
              </ModalSheetButton>
              <ArrowForwardRoundedIcon sx={{ color: 'blue', fontSize: 14, fontWeight: 600 }} />
              <ModalSheetButton
                selected={Boolean(input.to)}
                onClick={() => setSheetOpen([false, true])}
                disabled={!input.from}
                sx={{ mr: -0.5 }}
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
        {fromRow && (
          <ModalBox sx={{ mt: 1, p: 2, backgroundColor: 'grey.100' }}>
            <Overview from={fromRow} to={toRow} percent={input.percent} />
          </ModalBox>
        )}

        <Box sx={{ mt: 4, mb: 4 }}>
          <ModalTxCost gasCost={gasCost} />
          <ModalAdvancedSettings mt={-1}>
            <ModalInfoEditableSlippage value={input.slippage} onChange={(e) => setSlippage(e.target.value)} />
          </ModalAdvancedSettings>
        </Box>
        {errorData?.status && <ModalAlert message={errorData.message} variant={errorData.variant} />}
        <LoadingButton
          disabled={!input.from || !input.to || errorData?.status}
          loading={loadingStatus || isLoading}
          onClick={requiresApproval ? approve : rollover}
          variant="contained"
          fullWidth
        >
          {requiresApproval ? t('Approve') : t('Refinance your loan')}
        </LoadingButton>
      </Box>
    </>
  );
}

export default React.memo(Operation);
