import React, { FC, useCallback, useMemo, useState } from 'react';

import ModalTxCost from 'components/OperationsModal/ModalTxCost';
import ModalGif from 'components/OperationsModal/ModalGif';

import formatNumber from 'utils/formatNumber';

import { useWeb3 } from 'hooks/useWeb3';

import useApprove from 'hooks/useApprove';
import useBalance from 'hooks/useBalance';
import { useOperationContext, usePreviewTx } from 'contexts/OperationContext';
import useAccountData from 'hooks/useAccountData';
import { Grid } from '@mui/material';
import { ModalBox, ModalBoxCell, ModalBoxRow } from 'components/common/modal/ModalBox';
import AssetInput from 'components/OperationsModal/AssetInput';
import DateSelector from 'components/OperationsModal/DateSelector';
import ModalInfoMaturityStatus from 'components/OperationsModal/Info/ModalInfoMaturityStatus';
import ModalInfoAmount from 'components/OperationsModal/Info/ModalInfoAmount';
import ModalInfoHealthFactor from 'components/OperationsModal/Info/ModalInfoHealthFactor';
import ModalInfoFixedUtilizationRate from 'components/OperationsModal/Info/ModalInfoFixedUtilizationRate';
import ModalAdvancedSettings from 'components/common/modal/ModalAdvancedSettings';
import ModalInfoEditableSlippage from 'components/OperationsModal/Info/ModalInfoEditableSlippage';
import ModalAlert from 'components/common/modal/ModalAlert';
import ModalSubmit from 'components/OperationsModal/ModalSubmit';
import ModalInfoBorrowLimit from 'components/OperationsModal/Info/ModalInfoBorrowLimit';
import useHandleOperationError from 'hooks/useHandleOperationError';
import useAnalytics from 'hooks/useAnalytics';
import { useTranslation } from 'react-i18next';
import useTranslateOperation from 'hooks/useTranslateOperation';
import ModalInfoRepayWithDiscount from 'components/OperationsModal/Info/ModalInfoRepayWithDiscount';
import usePreviewer from 'hooks/usePreviewer';
import useDelayedEffect from 'hooks/useDelayedEffect';
import { WEI_PER_ETHER } from 'utils/const';
import { CustomError } from 'types/Error';
import useEstimateGas from 'hooks/useEstimateGas';
import { formatUnits, parseUnits, zeroAddress } from 'viem';
import dayjs from 'dayjs';
import { waitForTransaction } from '@wagmi/core';
import { gasLimit } from 'utils/gas';

type RepayWithDiscount = {
  principal: string;
  feeAtMaturity: string;
  amountWithDiscount: string;
  discount: string;
};

const RepayAtMaturity: FC = () => {
  const { t } = useTranslation();
  const translateOperation = useTranslateOperation();
  const { walletAddress, opts } = useWeb3();
  const previewerContract = usePreviewer();

  const {
    symbol,
    operation,
    errorData,
    setErrorData,
    qty,
    setQty,
    gasCost,
    tx,
    setTx,
    date,
    requiresApproval,
    setRequiresApproval,
    isLoading: isLoadingOp,
    setIsLoading: setIsLoadingOp,
    marketContract,
    assetContract,
    ETHRouterContract,
    rawSlippage,
    setRawSlippage,
    slippage,
  } = useOperationContext();

  const { transaction } = useAnalytics({
    operationInput: useMemo(() => ({ operation, symbol, qty }), [operation, symbol, qty]),
  });

  const [previewData, setPreviewData] = useState<RepayWithDiscount | undefined>();

  const handleOperationError = useHandleOperationError();

  const [penaltyAssets, setPenaltyAssets] = useState(0n);
  const [positionAssetsAmount, setPositionAssetsAmount] = useState(0n);

  const { marketAccount } = useAccountData(symbol);

  const maxAmountToRepay = useMemo(
    () => ((positionAssetsAmount + penaltyAssets) * slippage) / WEI_PER_ETHER,
    [positionAssetsAmount, penaltyAssets, slippage],
  );

  const walletBalance = useBalance(symbol, assetContract?.address);

  const isLateRepay = useMemo(() => date !== undefined && BigInt(dayjs().unix()) > date, [date]);

  const totalPositionAssets = useMemo(() => {
    if (!marketAccount || !date) return 0n;
    const pool = marketAccount.fixedBorrowPositions.find(({ maturity }) => maturity === date);
    return pool ? pool.position.principal + pool.position.fee : 0n;
  }, [date, marketAccount]);

  const preview = useCallback(
    async (cancelled: () => boolean) => {
      if (!date || !walletAddress || !previewerContract || !marketAccount || !qty || totalPositionAssets === 0n) return;

      const pool = marketAccount.fixedBorrowPositions.find(({ maturity }) => maturity === date);
      if (!pool) return;

      const userInput = parseUnits(qty, marketAccount.decimals);
      const positionAssets = userInput >= totalPositionAssets ? totalPositionAssets : userInput;

      const { assets } = await previewerContract.read.previewRepayAtMaturity([
        marketAccount.market,
        date,
        positionAssets,
        walletAddress ?? zeroAddress,
      ]);
      const feeAtMaturity =
        ((((positionAssets > pool.position.principal ? pool.position.principal : positionAssets) * pool.position.fee) /
          WEI_PER_ETHER) *
          WEI_PER_ETHER) /
        pool.position.principal;
      const principal = positionAssets - feeAtMaturity;
      const discount = assets - positionAssets;

      if (cancelled()) return;
      setPreviewData({
        principal: formatNumber(formatUnits(principal, marketAccount.decimals), marketAccount.symbol, true),
        amountWithDiscount: formatNumber(formatUnits(assets, marketAccount.decimals), marketAccount.symbol, true),
        feeAtMaturity: formatNumber(formatUnits(feeAtMaturity, marketAccount.decimals), marketAccount.symbol, true),
        discount: formatNumber(formatUnits(discount, marketAccount.decimals), marketAccount.symbol, true),
      });
    },
    [date, marketAccount, previewerContract, qty, totalPositionAssets, walletAddress],
  );

  const { isLoading: previewLoading } = useDelayedEffect({ effect: preview });

  const totalPenalties = useMemo(() => {
    if (!marketAccount || !date || !isLateRepay) return 0n;

    const { penaltyRate } = marketAccount;

    const currentTimestamp = BigInt(dayjs().unix());
    const penaltyTime = currentTimestamp - date;

    return (penaltyRate * penaltyTime * totalPositionAssets) / WEI_PER_ETHER;
  }, [marketAccount, date, isLateRepay, totalPositionAssets]);

  const {
    approve,
    estimateGas: approveEstimateGas,
    isLoading: approveIsLoading,
    needsApproval,
  } = useApprove('repayAtMaturity', assetContract, marketAccount?.market);

  const estimate = useEstimateGas();

  const previewGasCost = useCallback(
    async (quantity: string): Promise<bigint | undefined> => {
      if (!marketAccount || !walletAddress || !ETHRouterContract || !marketContract || !date || !quantity || !opts)
        return;

      if (await needsApproval(quantity)) {
        return approveEstimateGas();
      }

      const amount = positionAssetsAmount;
      const maxAmount = maxAmountToRepay;

      if (marketAccount.assetSymbol === 'WETH') {
        const sim = await ETHRouterContract.simulate.repayAtMaturity([date, amount], {
          ...opts,
          value: maxAmount,
        });

        const gasEstimation = await estimate(sim.request);
        if (amount + (gasEstimation ?? 0n) >= parseUnits(walletBalance || '0', 18)) {
          throw new CustomError(t('Reserve ETH for gas fees.'), 'warning');
        }
        return gasEstimation;
      }

      const sim = await marketContract.simulate.repayAtMaturity([date, amount, maxAmount, walletAddress], opts);
      return estimate(sim.request);
    },
    [
      opts,
      marketAccount,
      walletAddress,
      ETHRouterContract,
      marketContract,
      date,
      needsApproval,
      positionAssetsAmount,
      maxAmountToRepay,
      estimate,
      approveEstimateGas,
      walletBalance,
      t,
    ],
  );

  const { isLoading: previewIsLoading } = usePreviewTx({ qty, needsApproval, previewGasCost });

  const isLoading = useMemo(
    () => isLoadingOp || approveIsLoading || previewIsLoading,
    [isLoadingOp, approveIsLoading, previewIsLoading],
  );

  const onMax = useCallback(() => {
    if (!marketAccount) return;
    const { decimals } = marketAccount;
    setPenaltyAssets(totalPenalties);
    setPositionAssetsAmount(totalPositionAssets);
    setQty(formatUnits(totalPositionAssets + totalPenalties, decimals));

    if (walletBalance && parseUnits(walletBalance, decimals) < totalPositionAssets + totalPenalties)
      return setErrorData({ status: true, message: 'Insufficient balance' });

    setErrorData(undefined);
  }, [marketAccount, totalPenalties, totalPositionAssets, setQty, walletBalance, setErrorData]);

  const handleInputChange = useCallback(
    (value: string) => {
      if (!marketAccount) return;
      const { decimals } = marketAccount;

      setQty(value);

      const input = parseUnits(value || '0', decimals);

      if (input === 0n || totalPositionAssets === 0n) {
        return setErrorData({ status: true, message: 'Cannot repay 0' });
      }

      const newPositionAssetsAmount =
        totalPositionAssets === 0n
          ? 0n
          : (input * ((totalPositionAssets * WEI_PER_ETHER) / (totalPositionAssets + totalPenalties))) / WEI_PER_ETHER;
      const newPenaltyAssets = input - newPositionAssetsAmount;
      setPenaltyAssets(newPenaltyAssets);
      setPositionAssetsAmount(newPositionAssetsAmount);

      const totalAmount = newPenaltyAssets + newPositionAssetsAmount;
      if (walletBalance && parseUnits(walletBalance, decimals) < totalAmount) {
        return setErrorData({ status: true, message: 'Insufficient balance' });
      }

      setErrorData(undefined);
    },
    [marketAccount, setQty, totalPositionAssets, totalPenalties, walletBalance, setErrorData],
  );

  const repay = useCallback(async () => {
    if (!marketAccount || !date || !ETHRouterContract || !qty || !marketContract || !walletAddress || !opts) return;

    let hash;
    setIsLoadingOp(true);
    try {
      transaction.addToCart();

      if (marketAccount.assetSymbol === 'WETH') {
        const args = [date, positionAssetsAmount] as const;
        const gasEstimation = await ETHRouterContract.estimateGas.repayAtMaturity(args, {
          ...opts,
          value: maxAmountToRepay,
        });
        hash = await ETHRouterContract.write.repayAtMaturity(args, {
          ...opts,
          value: maxAmountToRepay,
          gasLimit: gasLimit(gasEstimation),
        });
      } else {
        const args = [date, positionAssetsAmount, maxAmountToRepay, walletAddress] as const;
        const gasEstimation = await marketContract.estimateGas.repayAtMaturity(args, opts);

        hash = await marketContract.write.repayAtMaturity(args, {
          ...opts,
          gasLimit: gasLimit(gasEstimation),
        });
      }

      transaction.beginCheckout();

      setTx({ status: 'processing', hash });

      const { status, transactionHash } = await waitForTransaction({ hash });

      setTx({ status: status ? 'success' : 'error', hash: transactionHash });

      if (status) transaction.purchase();
    } catch (error) {
      transaction.removeFromCart();
      if (hash) setTx({ status: 'error', hash });
      setErrorData({ status: true, message: handleOperationError(error) });
    } finally {
      setIsLoadingOp(false);
    }
  }, [
    marketAccount,
    date,
    ETHRouterContract,
    qty,
    marketContract,
    walletAddress,
    opts,
    setIsLoadingOp,
    transaction,
    setTx,
    positionAssetsAmount,
    maxAmountToRepay,
    setErrorData,
    handleOperationError,
  ]);

  const handleSubmitAction = useCallback(async () => {
    if (isLoading) return;
    if (requiresApproval) {
      await approve();
      setRequiresApproval(await needsApproval(qty));
      return;
    }

    return repay();
  }, [approve, isLoading, needsApproval, qty, repay, requiresApproval, setRequiresApproval]);

  if (tx) return <ModalGif tx={tx} tryAgain={repay} />;

  const decimals = marketAccount?.decimals ?? 18;

  return (
    <Grid container flexDirection="column">
      <Grid item>
        <ModalBox>
          <ModalBoxRow>
            <AssetInput
              qty={qty}
              symbol={symbol}
              decimals={decimals}
              onMax={onMax}
              onChange={handleInputChange}
              label={t('Debt amount')}
              amount={formatUnits(totalPositionAssets, decimals)}
            />
          </ModalBoxRow>
          <ModalBoxRow>
            <ModalBoxCell>
              <DateSelector />
            </ModalBoxCell>
            <ModalBoxCell>{date !== undefined && <ModalInfoMaturityStatus date={Number(date)} />}</ModalBoxCell>
            <ModalBoxCell>
              <ModalInfoAmount
                label={t('Amount at maturity')}
                symbol={symbol}
                value={formatNumber(formatUnits(totalPositionAssets, decimals), symbol, true)}
              />
            </ModalBoxCell>
            <ModalBoxCell>
              <ModalInfoAmount
                label={t('Max. amount to be paid')}
                value={formatNumber(formatUnits(maxAmountToRepay, decimals), symbol, true)}
                symbol={symbol}
              />
            </ModalBoxCell>
            {isLateRepay && (
              <>
                <ModalBoxCell>
                  <ModalInfoAmount
                    label={t('Penalties to be paid')}
                    value={formatNumber(formatUnits(penaltyAssets, decimals), symbol, true)}
                    symbol={symbol}
                  />
                </ModalBoxCell>
                <ModalBoxCell>
                  <ModalInfoAmount
                    label={t('Assets to be paid')}
                    value={formatNumber(formatUnits(positionAssetsAmount, decimals), symbol, true)}
                    symbol={symbol}
                  />
                </ModalBoxCell>
              </>
            )}
          </ModalBoxRow>
          <ModalBoxRow>
            <ModalBoxCell>
              <ModalInfoHealthFactor qty={qty} symbol={symbol} operation="repayAtMaturity" />
            </ModalBoxCell>
            {!isLateRepay && (
              <ModalBoxCell divisor>
                <ModalInfoBorrowLimit qty={qty} symbol={symbol} operation="repayAtMaturity" />
              </ModalBoxCell>
            )}
          </ModalBoxRow>
        </ModalBox>
      </Grid>

      <Grid item mt={2}>
        {!isLateRepay && previewData?.discount && (
          <ModalInfoRepayWithDiscount
            label={t('You are paying with discount')}
            symbol={symbol}
            isLoading={previewLoading}
            amountWithDiscount={previewData?.amountWithDiscount}
            principal={previewData?.principal}
            feeAtMaturity={previewData?.feeAtMaturity}
            discount={previewData?.discount}
          />
        )}
        {errorData?.component !== 'gas' && <ModalTxCost gasCost={gasCost} />}
        <ModalAdvancedSettings>
          {isLateRepay && <ModalInfoBorrowLimit qty={qty} symbol={symbol} operation="repayAtMaturity" variant="row" />}
          <ModalInfoEditableSlippage value={rawSlippage} onChange={(e) => setRawSlippage(e.target.value)} />
          {!isLateRepay && (
            <ModalInfoFixedUtilizationRate qty={qty} symbol={symbol} operation="repayAtMaturity" variant="row" />
          )}
        </ModalAdvancedSettings>
      </Grid>

      {errorData?.status && (
        <Grid item mt={1}>
          <ModalAlert variant={errorData.variant} message={errorData.message} />
        </Grid>
      )}

      <Grid item mt={{ xs: 2, sm: 3 }}>
        <ModalSubmit
          label={translateOperation('repayAtMaturity', { capitalize: true })}
          symbol={symbol}
          submit={handleSubmitAction}
          isLoading={isLoading}
          disabled={!qty || parseFloat(qty) <= 0 || isLoading || errorData?.status}
        />
      </Grid>
    </Grid>
  );
};

export default React.memo(RepayAtMaturity);
