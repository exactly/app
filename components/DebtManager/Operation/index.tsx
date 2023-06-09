import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Box, Grid, Typography } from '@mui/material';
import { useTranslation } from 'react-i18next';
import ArrowForwardRoundedIcon from '@mui/icons-material/ArrowForwardRounded';
import { splitSignature } from '@ethersproject/bytes';
import { usePublicClient, useSignTypedData } from 'wagmi';
import dayjs from 'dayjs';
import { formatUnits, Hex, isAddress, parseUnits, trim, pad, WalletClient } from 'viem';

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
import handleOperationError from 'utils/handleOperationError';
import ModalAlert from 'components/common/modal/ModalAlert';
import useRewards from 'hooks/useRewards';
import LoadingTransaction from '../Loading';
import { GAS_LIMIT_MULTIPLIER, WEI_PER_ETHER } from 'utils/const';
import OperationSquare from 'components/common/OperationSquare';
import Submit from '../Submit';
import useIsContract from 'hooks/useIsContract';

import { Permit } from './types';

function Operation() {
  const { t } = useTranslation();
  const { accountData, getMarketAccount } = useAccountData();
  const { walletAddress, chain, opts } = useWeb3();
  const publicClient = usePublicClient();
  const { signTypedDataAsync } = useSignTypedData();

  const [[fromSheetOpen, toSheetOpen], setSheetOpen] = useState([false, false]);
  const container = useRef<HTMLDivElement>(null);
  const fromSheetRef = useRef<HTMLDivElement>(null);
  const toSheetRef = useRef<HTMLDivElement>(null);

  const { rates } = useRewards();
  const isContract = useIsContract();

  const request = useGraphClient();

  const {
    tx,
    input,
    setFrom,
    setTo,
    setPercent,
    setSlippage,
    debtManager,
    market: marketContract,
    errorData,
    setErrorData,
    isLoading,
    needsApproval,
    approve,
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
      ({ id, market, maturity, assets, fee, timestamp }: any): Borrow => ({
        id,
        market,
        maturity,
        assets: parseUnits(assets, 18),
        fee: parseUnits(fee, 18),
        timestamp,
      }),
    );

    const apr = (symbol: string, market: string, maturity: bigint): bigint => {
      const marketAccount = getMarketAccount(symbol);
      if (!marketAccount) return 0n;

      const filtered = borrows.filter(
        (borrow) => borrow.market.toLowerCase() === market.toLowerCase() && BigInt(borrow.maturity) === maturity,
      );

      const [allProportionalAssets, allAssets] = filtered.reduce(
        ([aprAmounts, assets], borrow) => {
          const transactionAPR = calculateAPR(
            borrow.fee,
            borrow.assets,
            BigInt(borrow.timestamp),
            BigInt(borrow.maturity),
          );
          const proportionalAssets = (transactionAPR * borrow.assets) / 100n;

          return [aprAmounts + proportionalAssets, assets + borrow.assets];
        },
        [0n, 0n],
      );

      if (allAssets === 0n) return 0n;

      return allProportionalAssets / allAssets;
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
          ...(entry.floatingBorrowAssets > 0n
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
            maturity: position.maturity,
            balance: position.previewValue,
            usdPrice,
            decimals,
            apr: apr(assetSymbol, market, position.maturity),
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

      const fromRow = fromRows.find((r) => r.symbol === assetSymbol && r.maturity === input.from?.maturity);
      if (!fromRow || !fromRow.balance) {
        return;
      }

      const initialAssets = (fromRow.balance * BigInt(input.percent)) / 100n;
      if (!initialAssets) {
        return;
      }

      try {
        const previewPools = await previewerContract.read.previewBorrowAtAllMaturities(
          [marketAccount.market, initialAssets],
          opts,
        );
        const currentTimestamp = BigInt(dayjs().unix());

        const rewards = rates[assetSymbol];
        const fixedOptions: PositionTableRow[] = previewPools.map(({ maturity, assets }) => {
          const rate = (assets * WEI_PER_ETHER) / initialAssets;
          const fixedAPR = ((rate - WEI_PER_ETHER) * 31_536_000n) / (maturity - currentTimestamp);
          const fee = assets - initialAssets;

          return {
            symbol: assetSymbol,
            maturity,
            usdPrice,
            balance: assets,
            fee: fee < 0n ? 0n : fee,
            decimals,
            apr: fixedAPR,
            rewards,
          };
        });

        const fromMaturity = input.from.maturity;
        const options: PositionTableRow[] = [
          {
            symbol: assetSymbol,
            apr: floatingBorrowRate,
            usdPrice,
            decimals,
            rewards,
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
    [previewerContract, input.from, input.percent, getMarketAccount, fromRows, opts, rates],
  );

  const { isLoading: loadingToRows } = useDelayedEffect({ effect: updateToRows });

  const usdAmount = useMemo(() => {
    const row = fromRows.find((r) => r.symbol === input.from?.symbol && r.maturity === input.from?.maturity);
    if (!row || !row.balance) {
      return '';
    }

    return formatNumber(
      formatUnits((((row.balance * row.usdPrice) / WEI_PER_ETHER) * BigInt(input.percent)) / 100n || 0n, row.decimals),
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
    const slippage = WEI_PER_ETHER + parseUnits(raw as `${number}`, 18) / 100n;

    const ret: [bigint, bigint] = [0n, 0n];
    if (!fromRow || !toRow) {
      return ret;
    }

    const fromBalance = fromRow.balance ? (fromRow.balance * BigInt(input.percent)) / 100n : 0n;

    if (fromRow.maturity) {
      ret[0] = (fromBalance * slippage) / WEI_PER_ETHER;
    } else {
      ret[0] = fromBalance;
    }

    if (toRow.maturity) {
      ret[1] = toRow.balance ? (toRow.balance * slippage) / WEI_PER_ETHER : 0n;
    } else {
      ret[1] = fromBalance;
    }

    return ret;
  }, [input.slippage, input.percent, fromRow, toRow]);

  const [requiresApproval, setRequiresApproval] = useState(false);

  const populateTransaction = useCallback(async (): Promise<
    Parameters<WalletClient['writeContract']>[0] | undefined
  > => {
    if (!walletAddress || !debtManager || !marketContract || !input.from || !input.to || !opts) {
      return;
    }

    const percentage = (BigInt(input.percent) * WEI_PER_ETHER) / 100n;

    if (await isContract(walletAddress)) {
      if (input.from.maturity && input.to.maturity) {
        const args = [
          marketContract.address,
          input.from.maturity,
          input.to.maturity,
          maxRepayAssets,
          maxBorrowAssets,
          percentage,
        ] as const;
        const gasLimit = await debtManager.estimateGas.rollFixed(args, opts);
        const sim = await debtManager.simulate.rollFixed(args, {
          ...opts,
          gasLimit: (gasLimit * GAS_LIMIT_MULTIPLIER) / WEI_PER_ETHER,
        });
        return sim.request;
      } else if (input.to.maturity) {
        const args = [marketContract.address, input.to.maturity, maxBorrowAssets, percentage] as const;
        const gasLimit = await debtManager.estimateGas.rollFloatingToFixed(args, opts);
        const sim = await debtManager.simulate.rollFloatingToFixed(args, {
          ...opts,
          gasLimit: (gasLimit * GAS_LIMIT_MULTIPLIER) / WEI_PER_ETHER,
        });
        return sim.request;
      } else if (input.from.maturity) {
        const args = [marketContract.address, input.from.maturity, maxRepayAssets, percentage] as const;
        const gasLimit = await debtManager.estimateGas.rollFixedToFloating(args, opts);
        const sim = await debtManager.simulate.rollFixedToFloating(args, {
          ...opts,
          gasLimit: (gasLimit * GAS_LIMIT_MULTIPLIER) / WEI_PER_ETHER,
        });
        return sim.request;
      } else return;
    }

    const [marketImpl, marketNonce] = await Promise.all([
      publicClient.getStorageAt({
        address: marketContract.address,
        slot: '0x360894a13ba1a3210667c828492db98dca3e2076cc3735a920a3ca505d382bbc',
      }),
      marketContract.read.nonces([walletAddress], opts),
    ]);

    if (!marketImpl) return;
    const deadline = BigInt(dayjs().unix() + 3_600);
    const verifyingContract = pad(trim(marketImpl), { size: 20 });
    if (!isAddress(verifyingContract)) return;

    const { v, r, s } = await signTypedDataAsync({
      primaryType: 'Permit',
      domain: {
        name: '',
        version: '1',
        chainId: chain.id,
        verifyingContract,
      },
      types: { Permit },
      message: {
        owner: walletAddress,
        spender: debtManager.address,
        value: input.from.maturity && !input.to.maturity ? maxRepayAssets : maxBorrowAssets,
        nonce: marketNonce,
        deadline,
      },
    }).then(splitSignature);

    const permit = {
      account: walletAddress,
      deadline,
      ...{ v, r: r as Hex, s: s as Hex },
    } as const;

    if (input.from.maturity && input.to.maturity) {
      const args = [
        marketContract.address,
        input.from.maturity,
        input.to.maturity,
        maxRepayAssets,
        maxBorrowAssets,
        percentage,
        permit,
      ] as const;
      const gasLimit = await debtManager.estimateGas.rollFixed(args, opts);
      const sim = await debtManager.simulate.rollFixed(args, {
        ...opts,
        gasLimit: (gasLimit * GAS_LIMIT_MULTIPLIER) / WEI_PER_ETHER,
      });
      return sim.request;
    } else if (input.to.maturity) {
      const args = [marketContract.address, input.to.maturity, maxBorrowAssets, percentage, permit] as const;
      const gasLimit = await debtManager.estimateGas.rollFloatingToFixed(args, opts);
      const sim = await debtManager.simulate.rollFloatingToFixed(args, {
        ...opts,
        gasLimit: (gasLimit * GAS_LIMIT_MULTIPLIER) / WEI_PER_ETHER,
      });
      return sim.request;
    } else if (input.from.maturity) {
      const args = [marketContract.address, input.from.maturity, maxRepayAssets, percentage, permit] as const;
      const gasLimit = await debtManager.estimateGas.rollFixedToFloating(args, opts);
      const sim = await debtManager.simulate.rollFixedToFloating(args, {
        ...opts,
        gasLimit: (gasLimit * GAS_LIMIT_MULTIPLIER) / WEI_PER_ETHER,
      });
      return sim.request;
    }
  }, [
    opts,
    chain.id,
    debtManager,
    input.from,
    input.percent,
    input.to,
    isContract,
    marketContract,
    maxBorrowAssets,
    maxRepayAssets,
    publicClient,
    walletAddress,
    signTypedDataAsync,
  ]);

  const load = useCallback(async () => {
    try {
      setErrorData(undefined);
      if (!input.from || !input.to) return;
      setRequiresApproval(await needsApproval(maxBorrowAssets));
    } catch (e: unknown) {
      setErrorData({ status: true, message: handleOperationError(e) });
    }
  }, [input.from, input.to, maxBorrowAssets, needsApproval, setErrorData]);

  const { isLoading: loadingStatus } = useDelayedEffect({ effect: load });

  const rollover = useCallback(() => submit(populateTransaction), [populateTransaction, submit]);

  const approveRollover = useCallback(async () => {
    await approve(maxBorrowAssets);
    setRequiresApproval(await needsApproval(maxBorrowAssets));
  }, [needsApproval, approve, maxBorrowAssets]);

  if (tx && input.to) return <LoadingTransaction tx={tx} to={input.to} />;

  return (
    <>
      <ModalSheet
        ref={fromSheetRef}
        container={container.current}
        open={fromSheetOpen}
        onClose={onClose}
        title={t('Select Current Debt')}
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
        title={t('Select New Debt')}
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
          <ModalBoxRow>
            <Grid container mb={1.5}>
              <Grid item xs={7}>
                <Typography variant="caption" color="figma.grey.600">
                  {t('From')}
                </Typography>
              </Grid>
              <Grid item xs={5}>
                <Typography variant="caption" color="figma.grey.600">
                  {t('To')}
                </Typography>
              </Grid>
            </Grid>
            <Grid container>
              <Grid item xs={5}>
                <ModalSheetButton
                  selected={Boolean(input.from)}
                  onClick={() => setSheetOpen([true, false])}
                  sx={{ ml: -0.5 }}
                >
                  {input.from ? (
                    <>
                      <OperationSquare type={input.from.maturity ? 'fixed' : 'floating'} />
                      {input.from.maturity ? t('Fixed') : t('Variable')}
                    </>
                  ) : (
                    t('Current debt')
                  )}
                </ModalSheetButton>
                <Typography component="div" variant="subtitle1" color="figma.grey.500">
                  {input.from
                    ? input.from.maturity
                      ? parseTimestamp(input.from.maturity)
                      : t('Open-ended')
                    : t('Maturity')}
                </Typography>
              </Grid>
              <Grid display="flex" alignItems="center" justifyContent="center" item xs={2}>
                <ArrowForwardRoundedIcon sx={{ color: 'blue', fontSize: 14, fontWeight: 600 }} />
              </Grid>
              <Grid item xs={5}>
                <ModalSheetButton
                  selected={Boolean(input.to)}
                  onClick={() => {
                    if (input.from) {
                      setFrom(input.from);
                    }
                    setSheetOpen([false, true]);
                  }}
                  disabled={!input.from}
                  sx={{ ml: -0.5, mr: -0.5 }}
                >
                  {input.to ? (
                    <>
                      <OperationSquare type={input.to.maturity ? 'fixed' : 'floating'} />
                      {input.to.maturity ? t('Fixed') : t('Variable')}
                    </>
                  ) : (
                    t('New debt')
                  )}
                </ModalSheetButton>
                <Typography component="div" variant="subtitle1" color="figma.grey.500">
                  {input.to ? (input.to.maturity ? parseTimestamp(input.to.maturity) : t('Open-ended')) : t('Maturity')}
                </Typography>
              </Grid>
            </Grid>
          </ModalBoxRow>
        </ModalBox>
        {fromRow && (
          <ModalBox sx={{ mt: 1, p: 2, backgroundColor: 'grey.100' }}>
            <Overview from={fromRow} to={toRow} percent={BigInt(input.percent)} />
          </ModalBox>
        )}

        <Box sx={{ mt: 4, mb: 4 }}>
          <ModalAdvancedSettings mt={-1}>
            <ModalInfoEditableSlippage value={input.slippage} onChange={(e) => setSlippage(e.target.value)} />
          </ModalAdvancedSettings>
        </Box>
        {errorData?.status && <ModalAlert message={errorData.message} variant={errorData.variant} />}
        <Submit
          disabled={!input.from || !input.to || errorData?.status}
          loading={loadingStatus || isLoading}
          onClick={requiresApproval ? approveRollover : rollover}
          variant="contained"
          fullWidth
        >
          {requiresApproval ? t('Approve') : t('Refinance your loan')}
        </Submit>
      </Box>
    </>
  );
}

export default React.memo(Operation);
