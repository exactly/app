import { BigNumber, formatFixed, parseFixed } from '@ethersproject/bignumber';
import React, { FC, useCallback, useEffect, useMemo, useState } from 'react';
import { AddressZero, WeiPerEther, Zero } from '@ethersproject/constants';

import ModalGif from 'components/common/modal/ModalGif';
import ModalTxCost from 'components/common/modal/ModalTxCost';

import { useWeb3 } from 'hooks/useWeb3';

import useApprove from 'hooks/useApprove';
import usePreviewer from 'hooks/usePreviewer';
import { useOperationContext, usePreviewTx } from 'contexts/OperationContext';
import useAccountData from 'hooks/useAccountData';
import { Grid } from '@mui/material';
import { ModalBox, ModalBoxCell, ModalBoxRow } from 'components/common/modal/ModalBox';
import AssetInput from 'components/OperationsModal/AssetInput';
import DateSelector from 'components/OperationsModal/DateSelector';
import ModalInfoHealthFactor from 'components/OperationsModal/Info/ModalInfoHealthFactor';
import { useModalStatus } from 'contexts/ModalStatusContext';
import ModalInfoFixedUtilizationRate from 'components/OperationsModal/Info/ModalInfoFixedUtilizationRate';
import ModalAdvancedSettings from 'components/common/modal/ModalAdvancedSettings';
import ModalInfoEditableSlippage from 'components/OperationsModal/Info/ModalInfoEditableSlippage';
import ModalAlert from 'components/common/modal/ModalAlert';
import ModalSubmit from 'components/common/modal/ModalSubmit';
import ModalInfoAmount from 'components/OperationsModal/Info/ModalInfoAmount';
import formatNumber from 'utils/formatNumber';
import ModalInfo from 'components/common/modal/ModalInfo';
import ModalInfoMaturityStatus from 'components/OperationsModal/Info/ModalInfoMaturityStatus';
import useHandleOperationError from 'hooks/useHandleOperationError';
import useAnalytics from 'hooks/useAnalytics';
import { useTranslation } from 'react-i18next';
import useTranslateOperation from 'hooks/useTranslateOperation';
import { defaultAmount, gasLimitMultiplier } from 'utils/const';
import useEstimateGas from 'hooks/useEstimateGas';

const WithdrawAtMaturity: FC = () => {
  const { t } = useTranslation();
  const translateOperation = useTranslateOperation();
  const { track } = useAnalytics();
  const { operation } = useModalStatus();
  const { walletAddress } = useWeb3();

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
    ETHRouterContract,
    rawSlippage,
    setRawSlippage,
    slippage,
  } = useOperationContext();

  const handleOperationError = useHandleOperationError();

  const [minAmountToWithdraw, setMinAmountToWithdraw] = useState(Zero);
  const [amountToWithdraw, setAmountToWithdraw] = useState(Zero);

  const previewerContract = usePreviewer();

  const { marketAccount } = useAccountData(symbol);

  const isEarlyWithdraw = useMemo(() => {
    if (!date) return false;
    return Date.now() / 1000 < date;
  }, [date]);

  const positionAssets = useMemo(() => {
    if (!marketAccount || !date) return Zero;

    const pool = marketAccount.fixedDepositPositions.find(({ maturity }) => maturity.toNumber() === date);
    return pool ? pool.position.principal.add(pool.position.fee) : Zero;
  }, [date, marketAccount]);

  const amountAtFinish = useMemo(
    () => formatFixed(positionAssets, marketAccount?.decimals ?? 18),
    [positionAssets, marketAccount],
  );

  const {
    approve,
    estimateGas: approveEstimateGas,
    isLoading: approveIsLoading,
    needsApproval,
  } = useApprove('withdrawAtMaturity', marketContract, ETHRouterContract?.address);

  const previewWithdrawAtMaturity = useCallback(async () => {
    if (!marketAccount || !date || !previewerContract) return;

    if (!qty) {
      setMinAmountToWithdraw(Zero);
      return;
    }

    const parsedQtyValue = parseFixed(qty, marketAccount.decimals);

    if (parsedQtyValue.isZero()) {
      return setErrorData({ status: true, message: t('Cannot withdraw 0') });
    }

    if (parsedQtyValue.gt(positionAssets)) {
      return setErrorData({
        status: true,
        message: t(`You can't withdraw more than the deposited amount`),
      });
    }

    setErrorData(undefined);

    const { assets: amount } = await previewerContract.previewWithdrawAtMaturity(
      marketAccount.market,
      date,
      parsedQtyValue,
      walletAddress ?? AddressZero,
    );

    setAmountToWithdraw(amount);
    setMinAmountToWithdraw(isEarlyWithdraw ? amount.mul(slippage).div(WeiPerEther) : amount);
  }, [
    setErrorData,
    marketAccount,
    date,
    previewerContract,
    qty,
    positionAssets,
    walletAddress,
    isEarlyWithdraw,
    slippage,
    t,
  ]);

  useEffect(() => {
    if (errorData?.status) return;
    previewWithdrawAtMaturity().catch((error) => setErrorData({ status: true, message: handleOperationError(error) }));
  }, [previewWithdrawAtMaturity, errorData?.status, setErrorData, handleOperationError]);

  const estimate = useEstimateGas();

  const previewGasCost = useCallback(
    async (quantity: string): Promise<BigNumber | undefined> => {
      if (!marketAccount || !walletAddress || !marketContract || !ETHRouterContract || !date || !quantity) return;

      if (requiresApproval) {
        return approveEstimateGas();
      }

      const amount = amountToWithdraw.isZero() ? defaultAmount : amountToWithdraw;

      if (marketAccount.assetSymbol === 'WETH') {
        const populated = await ETHRouterContract.populateTransaction.withdrawAtMaturity(
          date,
          amount,
          minAmountToWithdraw,
        );

        return estimate(populated);
      }

      const populated = await marketContract.populateTransaction.withdrawAtMaturity(
        date,
        amount,
        minAmountToWithdraw,
        walletAddress,
        walletAddress,
      );

      return estimate(populated);
    },
    [
      marketAccount,
      walletAddress,
      marketContract,
      ETHRouterContract,
      date,
      requiresApproval,
      amountToWithdraw,
      minAmountToWithdraw,
      estimate,
      approveEstimateGas,
    ],
  );

  const { isLoading: previewIsLoading } = usePreviewTx({ qty, needsApproval, previewGasCost });

  const isLoading = useMemo(
    () => isLoadingOp || approveIsLoading || previewIsLoading,
    [isLoadingOp, approveIsLoading, previewIsLoading],
  );

  const onMax = useCallback(
    () => setQty(formatFixed(positionAssets, marketAccount?.decimals ?? 18)),
    [marketAccount, positionAssets, setQty],
  );

  const withdraw = useCallback(async () => {
    if (!marketAccount || !date || !marketContract || !walletAddress || !qty) return;

    let withdrawTx;
    try {
      setIsLoadingOp(true);

      if (marketAccount.assetSymbol === 'WETH') {
        if (!ETHRouterContract) return;

        const gasEstimation = await ETHRouterContract.estimateGas.withdrawAtMaturity(
          date,
          parseFixed(qty, 18),
          minAmountToWithdraw,
        );
        withdrawTx = await ETHRouterContract.withdrawAtMaturity(date, parseFixed(qty, 18), minAmountToWithdraw, {
          gasLimit: gasEstimation.mul(gasLimitMultiplier).div(WeiPerEther),
        });
      } else {
        const gasEstimation = await marketContract.estimateGas.withdrawAtMaturity(
          date,
          parseFixed(qty, marketAccount.decimals),
          minAmountToWithdraw,
          walletAddress,
          walletAddress,
        );

        withdrawTx = await marketContract.withdrawAtMaturity(
          date,
          parseFixed(qty, marketAccount.decimals),
          minAmountToWithdraw,
          walletAddress,
          walletAddress,
          {
            gasLimit: gasEstimation.mul(gasLimitMultiplier).div(WeiPerEther),
          },
        );
      }

      setTx({ status: 'processing', hash: withdrawTx?.hash });

      const { status, transactionHash } = await withdrawTx.wait();

      setTx({ status: status ? 'success' : 'error', hash: transactionHash });

      void track(status ? 'withdrawAtMaturity' : 'withdrawAtMaturityRevert', {
        amount: qty,
        asset: marketAccount.assetSymbol,
        maturity: date,
        hash: transactionHash,
      });
    } catch (error) {
      if (withdrawTx) setTx({ status: 'error', hash: withdrawTx?.hash });
      setErrorData({ status: true, message: handleOperationError(error) });
    } finally {
      setIsLoadingOp(false);
    }
  }, [
    marketAccount,
    date,
    marketContract,
    walletAddress,
    qty,
    setIsLoadingOp,
    setTx,
    track,
    ETHRouterContract,
    minAmountToWithdraw,
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

    void track('withdrawAtMaturityRequest', {
      amount: qty,
      maturity: date,
      asset: symbol,
    });

    return withdraw();
  }, [isLoading, requiresApproval, track, qty, date, symbol, withdraw, approve, setRequiresApproval, needsApproval]);

  if (tx) return <ModalGif tx={tx} tryAgain={withdraw} />;

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
              onChange={setQty}
              label={t('Deposited')}
              amount={amountAtFinish}
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
                value={formatNumber(amountAtFinish, symbol, true)}
              />
            </ModalBoxCell>
            <ModalBoxCell>
              <ModalInfoAmount
                label={t('Amount to receive')}
                value={formatNumber(formatFixed(amountToWithdraw, decimals), symbol, true)}
                symbol={symbol}
              />
            </ModalBoxCell>
          </ModalBoxRow>
          <ModalBoxRow>
            <ModalBoxCell>
              <ModalInfoHealthFactor qty={qty} symbol={symbol} operation={operation} />
            </ModalBoxCell>
          </ModalBoxRow>
        </ModalBox>
      </Grid>

      <Grid item mt={2}>
        {errorData?.component !== 'gas' && <ModalTxCost gasCost={gasCost} />}
        <ModalAdvancedSettings>
          <ModalInfo label={t('Min amount to withdraw')} variant="row">
            {formatNumber(formatFixed(minAmountToWithdraw, decimals), symbol, true)}
          </ModalInfo>
          {isEarlyWithdraw && (
            <ModalInfoEditableSlippage value={rawSlippage} onChange={(e) => setRawSlippage(e.target.value)} />
          )}
          {isEarlyWithdraw && (
            <ModalInfoFixedUtilizationRate qty={qty} symbol={symbol} operation="withdrawAtMaturity" variant="row" />
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
          label={translateOperation(operation, { capitalize: true })}
          symbol={symbol === 'WETH' && marketAccount ? marketAccount.symbol : symbol}
          submit={handleSubmitAction}
          isLoading={isLoading}
          disabled={!qty || parseFloat(qty) <= 0 || isLoading || errorData?.status}
        />
      </Grid>
    </Grid>
  );
};

export default React.memo(WithdrawAtMaturity);
