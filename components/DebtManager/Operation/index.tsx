import React, { useCallback, useMemo, useRef, useState } from 'react';
import { Box, Grid, Typography } from '@mui/material';
import { useTranslation } from 'react-i18next';
import ArrowForwardRoundedIcon from '@mui/icons-material/ArrowForwardRounded';
import { useContractEvents, usePublicClient, useSignTypedData } from 'wagmi';
import dayjs from 'dayjs';
import { formatUnits, hexToSignature, isAddress, parseEther, trim, pad, type Hex } from 'viem';
import { WAD } from '@exactly/lib';

import { ModalBox, ModalBoxRow } from 'components/common/modal/ModalBox';
import ModalAdvancedSettings from 'components/common/modal/ModalAdvancedSettings';
import ModalSheet from 'components/common/modal/ModalSheet';
import CustomSlider from 'components/common/CustomSlider';
import useAccountData from 'hooks/useAccountData';
import { useDebtManagerContext } from 'contexts/DebtManagerContext';
import parseTimestamp from 'utils/parseTimestamp';
import ModalSheetButton from 'components/common/modal/ModalSheetButton';
import formatNumber from 'utils/formatNumber';
import useDelayedEffect from 'hooks/useDelayedEffect';
import PositionTable, { PositionTableRow } from '../PositionTable';
import Overview from '../Overview';
import { calculateAPR } from 'utils/calculateAPR';

import ModalInfoEditableSlippage from 'components/OperationsModal/Info/ModalInfoEditableSlippage';
import handleOperationError from 'utils/handleOperationError';
import ModalAlert from 'components/common/modal/ModalAlert';
import useRewards from 'hooks/useRewards';
import LoadingTransaction from 'components/common/modal/Loading';
import OperationSquare from 'components/common/OperationSquare';
import Submit from '../Submit';
import useIsContract from 'hooks/useIsContract';
import { gasLimit } from 'utils/gas';
import {
  legacyPreviewerAddress,
  marketAbi,
  marketDaiAddress,
  marketDaiBlock,
  marketExaAddress,
  marketExaBlock,
  marketOpAddress,
  marketOpBlock,
  marketUsdcAddress,
  marketUsdcBlock,
  marketUsdCeAddress,
  marketUsdCeBlock,
  marketWbtcAddress,
  marketWbtcBlock,
  marketWethAddress,
  marketWethBlock,
  marketcbBtcAddress,
  marketcbBtcBlock,
  marketcbXrpAddress,
  marketcbXrpBlock,
  marketwstEthAddress,
  marketwstEthBlock,
  previewerAddress,
  readLegacyPreviewerPreviewBorrowAtAllMaturities,
  readPreviewerPreviewBorrowAtAllMaturities,
} from 'generated/wagmi';
import { defaultChain, wagmi } from 'utils/client';
import useReadOnly from 'hooks/useReadOnly';

const legacyPreviewerChainId = Object.keys(legacyPreviewerAddress)
  .map(Number)
  .find((chainId): chainId is keyof typeof legacyPreviewerAddress => chainId === defaultChain.id);
const previewerChainId = Object.keys(previewerAddress)
  .map(Number)
  .find((chainId): chainId is keyof typeof previewerAddress => chainId === defaultChain.id);

function Operation() {
  const { t } = useTranslation();
  const { accountData, getMarketAccount } = useAccountData();
  const { account } = useReadOnly();
  const publicClient = usePublicClient();
  const { signTypedDataAsync } = useSignTypedData();

  const [[fromSheetOpen, toSheetOpen], setSheetOpen] = useState([false, false]);
  const container = useRef<HTMLDivElement>(null);
  const fromSheetRef = useRef<HTMLDivElement>(null);
  const toSheetRef = useRef<HTMLDivElement>(null);

  const { rates } = useRewards();
  const isContract = useIsContract();

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

  const [toRows, setToRows] = useState<PositionTableRow[]>([]);

  const borrowFromBlock = useMemo(() => {
    const blocks =
      accountData?.flatMap(({ market }) =>
        (
          [
            [marketDaiAddress, marketDaiBlock],
            [marketUsdcAddress, marketUsdcBlock],
            [marketUsdCeAddress, marketUsdCeBlock],
            [marketWethAddress, marketWethBlock],
            [marketwstEthAddress, marketwstEthBlock],
            [marketOpAddress, marketOpBlock],
            [marketWbtcAddress, marketWbtcBlock],
            [marketcbBtcAddress, marketcbBtcBlock],
            [marketcbXrpAddress, marketcbXrpBlock],
            [marketExaAddress, marketExaBlock],
          ] as const
        ).flatMap(([address, block]) =>
          Object.entries(address).some(
            ([chainId, value]) => Number(chainId) === defaultChain.id && value.toLowerCase() === market.toLowerCase(),
          )
            ? Object.entries(block).flatMap(([chainId, value]) => (Number(chainId) === defaultChain.id ? [value] : []))
            : [],
        ),
      ) ?? [];

    return blocks.length ? blocks.reduce((min, block) => (block < min ? block : min)) : undefined;
  }, [accountData]);

  const { data: borrowEvents = [] } = useContractEvents({
    address: accountData?.map(({ market }) => market),
    abi: marketAbi,
    eventName: 'BorrowAtMaturity',
    strict: true,
    args: account ? { borrower: account } : undefined,
    fromBlock: borrowFromBlock,
    toBlock: 'latest',
    chainId: defaultChain.id,
    query: { enabled: Boolean(account && accountData?.length) },
  });

  const fromRows = useMemo<PositionTableRow[]>(() => {
    if (!accountData) return [];

    return accountData.flatMap(
      ({ assetSymbol, market, decimals, usdPrice, floatingBorrowRate, floatingBorrowAssets, fixedBorrowPositions }) => {
        return [
          ...(floatingBorrowAssets > 0n
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
          ...fixedBorrowPositions.map((position) => {
            const [allProportionalAssets, allAssets] = borrowEvents
              .filter(
                (event) =>
                  event.address.toLowerCase() === market.toLowerCase() &&
                  event.args.maturity === position.maturity &&
                  event.blockTimestamp !== undefined,
              )
              .reduce(
                ([aprAmounts, assets], event) => {
                  const transactionAPR = calculateAPR(
                    event.args.fee,
                    event.args.assets,
                    event.blockTimestamp ?? 0n,
                    event.args.maturity,
                  );
                  return [aprAmounts + (transactionAPR * event.args.assets) / 100n, assets + event.args.assets];
                },
                [0n, 0n],
              );

            return {
              symbol: assetSymbol,
              maturity: position.maturity,
              balance: position.previewValue,
              usdPrice,
              decimals,
              apr: allAssets === 0n ? 0n : allProportionalAssets / allAssets,
            };
          }),
        ];
      },
    );
  }, [accountData, borrowEvents]);

  const updateToRows = useCallback(
    async (cancelled: () => boolean) => {
      if (!input.from) return;

      const marketAccount = getMarketAccount(input.from.symbol);
      if (!marketAccount) return;

      const { floatingBorrowRate, floatingBorrowAssets, fixedBorrowPositions, usdPrice, assetSymbol, decimals } =
        marketAccount;

      const fromRow =
        fromRows.find((r) => r.symbol === assetSymbol && r.maturity === input.from?.maturity) ??
        (input.from.maturity
          ? fixedBorrowPositions.flatMap((position) =>
              position.maturity === input.from?.maturity
                ? [
                    {
                      symbol: assetSymbol,
                      maturity: position.maturity,
                      balance: position.previewValue,
                      usdPrice,
                      decimals,
                      apr: 0n,
                    },
                  ]
                : [],
            )[0]
          : floatingBorrowAssets > 0n
            ? {
                symbol: assetSymbol,
                balance: floatingBorrowAssets,
                apr: floatingBorrowRate,
                usdPrice,
                decimals,
              }
            : undefined);
      if (!fromRow || !fromRow.balance) {
        return;
      }

      const initialAssets = (fromRow.balance * BigInt(input.percent)) / 100n;
      if (!initialAssets) {
        return;
      }

      try {
        const previewPools =
          legacyPreviewerChainId !== undefined
            ? await readLegacyPreviewerPreviewBorrowAtAllMaturities(wagmi, {
                chainId: legacyPreviewerChainId,
                args: [marketAccount.market, initialAssets],
              })
            : previewerChainId !== undefined
              ? await readPreviewerPreviewBorrowAtAllMaturities(wagmi, {
                  chainId: previewerChainId,
                  args: [marketAccount.market, initialAssets],
                })
              : undefined;
        if (!previewPools) return;
        const currentTimestamp = BigInt(dayjs().unix());

        const rewards = rates[assetSymbol];
        const fixedOptions: PositionTableRow[] = previewPools.map(({ maturity, assets }) => {
          const rate = (assets * WAD) / initialAssets;
          const fixedAPR = ((rate - WAD) * 31_536_000n) / (maturity - currentTimestamp);
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
      } catch {
        if (cancelled()) return;
        setToRows([]);
      }
    },
    [input.from, input.percent, getMarketAccount, fromRows, rates],
  );

  const { isLoading: loadingToRows } = useDelayedEffect({ effect: updateToRows });

  const fromRow = useMemo((): PositionTableRow | undefined => {
    const row = fromRows.find((r) => r.symbol === input.from?.symbol && r.maturity === input.from?.maturity);
    if (row) return row;

    const marketAccount = input.from ? getMarketAccount(input.from.symbol) : undefined;
    if (!marketAccount) return undefined;

    const { floatingBorrowRate, floatingBorrowAssets, fixedBorrowPositions, usdPrice, assetSymbol, decimals } =
      marketAccount;
    return input.from?.maturity
      ? fixedBorrowPositions.flatMap((position) =>
          position.maturity === input.from?.maturity
            ? [
                {
                  symbol: assetSymbol,
                  maturity: position.maturity,
                  balance: position.previewValue,
                  usdPrice,
                  decimals,
                  apr: 0n,
                },
              ]
            : [],
        )[0]
      : floatingBorrowAssets > 0n
        ? {
            symbol: assetSymbol,
            balance: floatingBorrowAssets,
            apr: floatingBorrowRate,
            usdPrice,
            decimals,
          }
        : undefined;
  }, [fromRows, getMarketAccount, input.from]);

  const toRow = useMemo(
    () => toRows.find((row) => input.to?.symbol === row.symbol && input.to?.maturity === row.maturity),
    [input.to, toRows],
  );

  const usdAmount = useMemo(() => {
    if (!fromRow?.balance) return '';

    return formatNumber(
      formatUnits(
        (((fromRow.balance * fromRow.usdPrice) / WAD) * BigInt(input.percent)) / 100n || 0n,
        fromRow.decimals,
      ),
      'USD',
      true,
    );
  }, [fromRow, input.percent]);

  const [maxRepayAssets, maxBorrowAssets] = useMemo(() => {
    const raw = input.slippage || '0';
    const slippage = WAD + parseEther(raw) / 100n;

    if (!fromRow || !toRow) {
      return [0n, 0n];
    }

    const fromBalance = fromRow.balance ? (fromRow.balance * BigInt(input.percent)) / 100n : 0n;
    const toBalance = toRow.balance ? toRow.balance : fromBalance;

    return [(fromBalance * slippage) / WAD, (toBalance * slippage) / WAD];
  }, [input.slippage, input.percent, fromRow, toRow]);

  const [requiresApproval, setRequiresApproval] = useState(false);

  const executeTransaction = useCallback(async (): Promise<Hex | undefined> => {
    if (!account || !debtManager || !marketContract || !input.from || !input.to || !publicClient) {
      return;
    }

    const percentage = (BigInt(input.percent) * WAD) / 100n;
    const accountOptions = { account, chain: defaultChain };

    if (await isContract(account)) {
      if (input.from.maturity && input.to.maturity) {
        const args = [
          marketContract.address,
          input.from.maturity,
          input.to.maturity,
          maxRepayAssets,
          maxBorrowAssets,
          percentage,
        ] as const;
        const gas = await debtManager.estimateGas.rollFixed(args, accountOptions);
        const options = { ...accountOptions, gas: gasLimit(gas) };
        await debtManager.simulate.rollFixed(args, options);
        return debtManager.write.rollFixed(args, options);
      } else if (input.to.maturity) {
        const args = [marketContract.address, input.to.maturity, maxBorrowAssets, percentage] as const;
        const gas = await debtManager.estimateGas.rollFloatingToFixed(args, accountOptions);
        const options = { ...accountOptions, gas: gasLimit(gas) };
        await debtManager.simulate.rollFloatingToFixed(args, options);
        return debtManager.write.rollFloatingToFixed(args, options);
      } else if (input.from.maturity) {
        const args = [marketContract.address, input.from.maturity, maxRepayAssets, percentage] as const;
        const gas = await debtManager.estimateGas.rollFixedToFloating(args, accountOptions);
        const options = { ...accountOptions, gas: gasLimit(gas) };
        await debtManager.simulate.rollFixedToFloating(args, options);
        return debtManager.write.rollFixedToFloating(args, options);
      } else return;
    }

    const [marketImpl, marketNonce] = await Promise.all([
      publicClient.getStorageAt({
        address: marketContract.address,
        slot: '0x360894a13ba1a3210667c828492db98dca3e2076cc3735a920a3ca505d382bbc',
      }),
      marketContract.read.nonces([account], accountOptions),
    ]);

    if (!marketImpl) return;
    const deadline = BigInt(dayjs().unix() + 3_600);
    const verifyingContract = pad(trim(marketImpl as `0x${string}`), { size: 20 });
    if (!isAddress(verifyingContract)) return;

    const value = await marketContract.read.previewWithdraw([maxBorrowAssets]);
    const { v, r, s } = await signTypedDataAsync({
      primaryType: 'Permit',
      domain: {
        name: '',
        version: '1',
        chainId: defaultChain.id,
        verifyingContract,
      },
      types: {
        Permit: [
          { name: 'owner', type: 'address' },
          { name: 'spender', type: 'address' },
          { name: 'value', type: 'uint256' },
          { name: 'nonce', type: 'uint256' },
          { name: 'deadline', type: 'uint256' },
        ],
      },
      message: {
        owner: account,
        spender: debtManager.address,
        value,
        nonce: marketNonce,
        deadline,
      },
    }).then(hexToSignature);

    const permit = {
      account,
      deadline,
      value,
      ...{ v: Number(v), r, s },
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
      const gas = await debtManager.estimateGas.rollFixed(args, accountOptions);
      const options = { ...accountOptions, gas: gasLimit(gas) };
      await debtManager.simulate.rollFixed(args, options);
      return debtManager.write.rollFixed(args, options);
    } else if (input.to.maturity) {
      const args = [marketContract.address, input.to.maturity, maxBorrowAssets, percentage, permit] as const;
      const gas = await debtManager.estimateGas.rollFloatingToFixed(args, accountOptions);
      const options = { ...accountOptions, gas: gasLimit(gas) };
      await debtManager.simulate.rollFloatingToFixed(args, options);
      return debtManager.write.rollFloatingToFixed(args, options);
    } else if (input.from.maturity) {
      const args = [marketContract.address, input.from.maturity, maxRepayAssets, percentage, permit] as const;
      const gas = await debtManager.estimateGas.rollFixedToFloating(args, accountOptions);
      const options = { ...accountOptions, gas: gasLimit(gas) };
      await debtManager.simulate.rollFixedToFloating(args, options);
      return debtManager.write.rollFixedToFloating(args, options);
    }
  }, [
    debtManager,
    input.from,
    input.percent,
    input.to,
    isContract,
    marketContract,
    maxBorrowAssets,
    maxRepayAssets,
    publicClient,
    account,
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

  const { isLoading: loadingStatus } = useDelayedEffect({ effect: load, delay: 0 });

  const rollover = useCallback(() => submit(executeTransaction), [executeTransaction, submit]);

  const approveRollover = useCallback(async () => {
    await approve(maxBorrowAssets);
    setRequiresApproval(await needsApproval(maxBorrowAssets));
  }, [needsApproval, approve, maxBorrowAssets]);

  if (tx && input.to) {
    return (
      <LoadingTransaction
        tx={tx}
        maturity={input.to.maturity}
        messages={{
          pending: t('You are refinancing your position'),
          success: t('Your position has been refinanced'),
          error: t('Something went wrong'),
        }}
      />
    );
  }

  return (
    <>
      <ModalSheet
        ref={fromSheetRef}
        container={container.current}
        open={fromSheetOpen}
        onClose={onClose}
        title={t('Select Current Debt')}
        data-testid="rollover-sheet-from"
      >
        <PositionTable
          loading={!accountData}
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
        data-testid="rollover-sheet-to"
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
                  data-testid="rollover-from"
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
                <Typography
                  component="div"
                  variant="subtitle1"
                  color="figma.grey.500"
                  data-testid="rollover-from-label"
                >
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
                  data-testid="rollover-to"
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
                <Typography component="div" variant="subtitle1" color="figma.grey.500" data-testid="rollover-to-label">
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
          data-testid={requiresApproval ? 'rollover-approve' : 'rollover-submit'}
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
