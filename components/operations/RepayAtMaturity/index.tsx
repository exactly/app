import React, { FC, useCallback, useMemo, useState } from 'react';
import { BigNumber, formatFixed, parseFixed } from '@ethersproject/bignumber';
import { AddressZero, WeiPerEther, Zero } from '@ethersproject/constants';

import ModalGif from 'components/common/modal/ModalGif';
import ModalTxCost from 'components/common/modal/ModalTxCost';

import formatNumber from 'utils/formatNumber';

import { useWeb3 } from 'hooks/useWeb3';

import useApprove from 'hooks/useApprove';
import useBalance from 'hooks/useBalance';
import { useOperationContext, usePreviewTx } from 'contexts/OperationContext';
import useAccountData from 'hooks/useAccountData';
import { Grid } from '@mui/material';
import { ModalBox, ModalBoxCell, ModalBoxRow } from 'components/common/modal/ModalBox';
import AssetInput from 'components/OperationsModal/AssetInput';
import { useModalStatus } from 'contexts/ModalStatusContext';
import DateSelector from 'components/OperationsModal/DateSelector';
import ModalInfoMaturityStatus from 'components/OperationsModal/Info/ModalInfoMaturityStatus';
import ModalInfoAmount from 'components/OperationsModal/Info/ModalInfoAmount';
import ModalInfoHealthFactor from 'components/OperationsModal/Info/ModalInfoHealthFactor';
import ModalInfoFixedUtilizationRate from 'components/OperationsModal/Info/ModalInfoFixedUtilizationRate';
import ModalAdvancedSettings from 'components/common/modal/ModalAdvancedSettings';
import ModalInfoEditableSlippage from 'components/OperationsModal/Info/ModalInfoEditableSlippage';
import ModalAlert from 'components/common/modal/ModalAlert';
import ModalSubmit from 'components/common/modal/ModalSubmit';
import ModalInfoBorrowLimit from 'components/OperationsModal/Info/ModalInfoBorrowLimit';
import useHandleOperationError from 'hooks/useHandleOperationError';
import useAnalytics from 'hooks/useAnalytics';
import { useTranslation } from 'react-i18next';
import useTranslateOperation from 'hooks/useTranslateOperation';
import ModalInfoRepayWithDiscount from 'components/OperationsModal/Info/ModalInfoRepayWithDiscount';
import usePreviewer from 'hooks/usePreviewer';
import useDelayedEffect from 'hooks/useDelayedEffect';
import { defaultAmount, gasLimitMultiplier } from 'utils/const';

type RepayWithDiscount = {
  principal: string;
  feeAtMaturity: string;
  amountWithDiscount: string;
  discount: string;
};

const RepayAtMaturity: FC = () => {
  const { t } = useTranslation();
  const translateOperation = useTranslateOperation();
  const { track } = useAnalytics();
  const { operation } = useModalStatus();
  const { walletAddress } = useWeb3();
  const previewerContract = usePreviewer();

  const {
    symbol,
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

  const [previewData, setPreviewData] = useState<RepayWithDiscount | undefined>();

  const handleOperationError = useHandleOperationError();

  const [penaltyAssets, setPenaltyAssets] = useState(Zero);
  const [positionAssetsAmount, setPositionAssetsAmount] = useState(Zero);

  const { marketAccount } = useAccountData(symbol);

  const maxAmountToRepay = useMemo(
    () => positionAssetsAmount.add(penaltyAssets).mul(slippage).div(WeiPerEther),
    [positionAssetsAmount, penaltyAssets, slippage],
  );

  const walletBalance = useBalance(symbol, assetContract);

  const isLateRepay = useMemo(() => date && Date.now() / 1000 > date, [date]);

  const totalPositionAssets = useMemo(() => {
    if (!marketAccount || !date) return Zero;
    const pool = marketAccount.fixedBorrowPositions.find(({ maturity }) => maturity.toNumber() === date);
    return pool ? pool.position.principal.add(pool.position.fee) : Zero;
  }, [date, marketAccount]);

  const preview = useCallback(async () => {
    if (
      !marketContract ||
      !date ||
      !walletAddress ||
      !previewerContract ||
      !marketAccount ||
      !qty ||
      totalPositionAssets.isZero()
    )
      return;

    const pool = marketAccount.fixedBorrowPositions.find(({ maturity }) => maturity.toNumber() === date);
    if (!pool) return;

    const userInput = parseFixed(qty, marketAccount.decimals);
    const positionAssets = userInput >= totalPositionAssets ? totalPositionAssets : userInput;

    const { assets } = await previewerContract.previewRepayAtMaturity(
      marketContract.address,
      date,
      positionAssets,
      walletAddress ?? AddressZero,
    );
    const feeAtMaturity = (positionAssets > pool.position.principal ? pool.position.principal : positionAssets)
      .mul(pool.position.fee)
      .div(WeiPerEther)
      .mul(WeiPerEther)
      .div(pool.position.principal);
    const principal = positionAssets.sub(feeAtMaturity);
    const discount = assets.sub(positionAssets);

    setPreviewData({
      principal: formatNumber(formatFixed(principal, marketAccount.decimals), marketAccount.symbol, true),
      amountWithDiscount: formatNumber(formatFixed(assets, marketAccount.decimals), marketAccount.symbol, true),
      feeAtMaturity: formatNumber(formatFixed(feeAtMaturity, marketAccount.decimals), marketAccount.symbol, true),
      discount: formatNumber(formatFixed(discount, marketAccount.decimals), marketAccount.symbol, true),
    });
  }, [date, marketAccount, marketContract, previewerContract, qty, totalPositionAssets, walletAddress]);

  const { isLoading: previewLoading } = useDelayedEffect({ effect: preview });

  const totalPenalties = useMemo(() => {
    if (!marketAccount || !date || !isLateRepay) return Zero;

    const { penaltyRate } = marketAccount;

    const currentTimestamp = Math.floor(Date.now() / 1000);
    const penaltyTime = currentTimestamp - date;

    return penaltyRate.mul(penaltyTime).mul(totalPositionAssets).div(WeiPerEther);
  }, [marketAccount, date, isLateRepay, totalPositionAssets]);

  const {
    approve,
    estimateGas: approveEstimateGas,
    isLoading: approveIsLoading,
    needsApproval,
  } = useApprove('repayAtMaturity', assetContract, marketContract?.address);

  const previewGasCost = useCallback(
    async (quantity: string): Promise<BigNumber | undefined> => {
      if (!marketAccount || !walletAddress || !ETHRouterContract || !marketContract || !date || !quantity) return;

      const gasPrice = (await ETHRouterContract.provider.getFeeData()).maxFeePerGas;
      if (!gasPrice) return;

      if (requiresApproval) {
        const gasEstimation = await approveEstimateGas();
        return gasEstimation?.mul(gasPrice);
      }

      const amount = positionAssetsAmount.isZero() ? defaultAmount : positionAssetsAmount;
      const maxAmount = maxAmountToRepay.isZero() ? defaultAmount.mul(slippage).div(WeiPerEther) : maxAmountToRepay;

      if (marketAccount.assetSymbol === 'WETH') {
        const gasLimit = await ETHRouterContract.estimateGas.repayAtMaturity(date, amount, {
          value: maxAmount,
        });

        return gasPrice.mul(gasLimit);
      }

      const gasLimit = await marketContract.estimateGas.repayAtMaturity(date, amount, maxAmount, walletAddress);

      return gasPrice.mul(gasLimit);
    },
    [
      marketAccount,
      walletAddress,
      ETHRouterContract,
      marketContract,
      date,
      requiresApproval,
      positionAssetsAmount,
      maxAmountToRepay,
      slippage,
      approveEstimateGas,
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
    setQty(formatFixed(totalPositionAssets.add(totalPenalties), decimals));

    if (walletBalance && parseFixed(walletBalance, decimals).lt(totalPositionAssets.add(totalPenalties)))
      return setErrorData({ status: true, message: 'Insufficient balance' });

    setErrorData(undefined);
  }, [marketAccount, totalPenalties, totalPositionAssets, setQty, walletBalance, setErrorData]);

  const handleInputChange = useCallback(
    (value: string) => {
      if (!marketAccount) return;
      const { decimals } = marketAccount;

      setQty(value);

      const input = parseFixed(value || '0', decimals);

      if (input.isZero() || totalPositionAssets.isZero()) {
        return setErrorData({ status: true, message: 'Cannot repay 0' });
      }

      const newPositionAssetsAmount = totalPositionAssets.isZero()
        ? Zero
        : input.mul(totalPositionAssets.mul(WeiPerEther).div(totalPositionAssets.add(totalPenalties))).div(WeiPerEther);
      const newPenaltyAssets = input.sub(newPositionAssetsAmount);
      setPenaltyAssets(newPenaltyAssets);
      setPositionAssetsAmount(newPositionAssetsAmount);

      const totalAmount = newPenaltyAssets.add(newPositionAssetsAmount);
      if (walletBalance && parseFixed(walletBalance, decimals).lt(totalAmount)) {
        return setErrorData({ status: true, message: 'Insufficient balance' });
      }

      setErrorData(undefined);
    },
    [marketAccount, setQty, totalPositionAssets, totalPenalties, walletBalance, setErrorData],
  );

  const repay = useCallback(async () => {
    if (!marketAccount || !date || !ETHRouterContract || !qty || !marketContract || !walletAddress) return;

    let repayTx;
    try {
      setIsLoadingOp(true);

      if (marketAccount.assetSymbol === 'WETH') {
        const gasEstimation = await ETHRouterContract.estimateGas.repayAtMaturity(date, positionAssetsAmount, {
          value: maxAmountToRepay,
        });

        repayTx = await ETHRouterContract.repayAtMaturity(date, positionAssetsAmount, {
          gasLimit: gasEstimation.mul(gasLimitMultiplier).div(WeiPerEther),
          value: maxAmountToRepay,
        });
      } else {
        const gasEstimation = await marketContract.estimateGas.repayAtMaturity(
          date,
          positionAssetsAmount,
          maxAmountToRepay,
          walletAddress,
        );

        repayTx = await marketContract.repayAtMaturity(date, positionAssetsAmount, maxAmountToRepay, walletAddress, {
          gasLimit: gasEstimation.mul(gasLimitMultiplier).div(WeiPerEther),
        });
      }

      setTx({ status: 'processing', hash: repayTx?.hash });

      const { status, transactionHash } = await repayTx.wait();

      setTx({ status: status ? 'success' : 'error', hash: transactionHash });

      void track(status ? 'repayAtMaturity' : 'repayAtMaturityRevert', {
        amount: qty,
        asset: marketAccount.assetSymbol,
        maturity: date,
        hash: transactionHash,
      });
    } catch (error) {
      if (repayTx) setTx({ status: 'error', hash: repayTx?.hash });
      setErrorData({ status: true, message: handleOperationError(error) });
    } finally {
      setIsLoadingOp(false);
    }
  }, [
    marketAccount,
    ETHRouterContract,
    date,
    handleOperationError,
    marketContract,
    maxAmountToRepay,
    positionAssetsAmount,
    qty,
    setErrorData,
    setIsLoadingOp,
    setTx,
    track,
    walletAddress,
  ]);

  const handleSubmitAction = useCallback(async () => {
    if (isLoading) return;
    if (requiresApproval) {
      await approve();
      setRequiresApproval(await needsApproval(qty));
      return;
    }

    void track('repayAtMaturityRequest', {
      amount: qty,
      maturity: date,
      asset: symbol,
    });

    return repay();
  }, [approve, date, isLoading, needsApproval, qty, repay, requiresApproval, setRequiresApproval, symbol, track]);

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
              amount={formatFixed(totalPositionAssets, decimals)}
            />
          </ModalBoxRow>
          <ModalBoxRow>
            <ModalBoxCell>
              <DateSelector />
            </ModalBoxCell>
            <ModalBoxCell>{date && <ModalInfoMaturityStatus date={date} />}</ModalBoxCell>
            <ModalBoxCell>
              <ModalInfoAmount
                label={t('Amount at maturity')}
                symbol={symbol}
                value={formatNumber(formatFixed(totalPositionAssets, decimals), symbol, true)}
              />
            </ModalBoxCell>
            <ModalBoxCell>
              <ModalInfoAmount
                label={t('Max. amount to be paid')}
                value={formatNumber(formatFixed(maxAmountToRepay, decimals), symbol, true)}
                symbol={symbol}
              />
            </ModalBoxCell>
            {isLateRepay && (
              <>
                <ModalBoxCell>
                  <ModalInfoAmount
                    label={t('Penalties to be paid')}
                    value={formatNumber(formatFixed(penaltyAssets, decimals), symbol, true)}
                    symbol={symbol}
                  />
                </ModalBoxCell>
                <ModalBoxCell>
                  <ModalInfoAmount
                    label={t('Assets to be paid')}
                    value={formatNumber(formatFixed(positionAssetsAmount, decimals), symbol, true)}
                    symbol={symbol}
                  />
                </ModalBoxCell>
              </>
            )}
          </ModalBoxRow>
          <ModalBoxRow>
            <ModalBoxCell>
              <ModalInfoHealthFactor qty={qty} symbol={symbol} operation={operation} />
            </ModalBoxCell>
            {!isLateRepay && (
              <ModalBoxCell divisor>
                <ModalInfoBorrowLimit qty={qty} symbol={symbol} operation={operation} />
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
          {isLateRepay && <ModalInfoBorrowLimit qty={qty} symbol={symbol} operation={operation} variant="row" />}
          <ModalInfoEditableSlippage value={rawSlippage} onChange={(e) => setRawSlippage(e.target.value)} />
          {!isLateRepay && (
            <ModalInfoFixedUtilizationRate qty={qty} symbol={symbol} operation="repayAtMaturity" variant="row" />
          )}
        </ModalAdvancedSettings>
      </Grid>

      {errorData?.status && (
        <Grid item mt={1}>
          <ModalAlert variant="error" message={errorData.message} />
        </Grid>
      )}

      <Grid item mt={{ xs: 2, sm: 3 }}>
        <ModalSubmit
          label={translateOperation(operation, { capitalize: true })}
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
