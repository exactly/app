import React, { FC, useCallback, useEffect, useMemo, useState } from 'react';

import ModalTxCost from 'components/OperationsModal/ModalTxCost';
import ModalGif from 'components/OperationsModal/ModalGif';

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
import ModalInfoFixedUtilizationRate from 'components/OperationsModal/Info/ModalInfoFixedUtilizationRate';
import ModalAdvancedSettings from 'components/common/modal/ModalAdvancedSettings';
import ModalInfoEditableSlippage from 'components/OperationsModal/Info/ModalInfoEditableSlippage';
import ModalAlert from 'components/common/modal/ModalAlert';
import ModalSubmit from 'components/OperationsModal/ModalSubmit';
import ModalInfoAmount from 'components/OperationsModal/Info/ModalInfoAmount';
import formatNumber from 'utils/formatNumber';
import ModalInfo from 'components/common/modal/ModalInfo';
import ModalInfoMaturityStatus from 'components/OperationsModal/Info/ModalInfoMaturityStatus';
import useHandleOperationError from 'hooks/useHandleOperationError';
import useAnalytics from 'hooks/useAnalytics';
import { useTranslation } from 'react-i18next';
import useTranslateOperation from 'hooks/useTranslateOperation';
import { WEI_PER_ETHER } from 'utils/const';
import useEstimateGas from 'hooks/useEstimateGas';
import { formatUnits, parseUnits, zeroAddress } from 'viem';
import { ERC20 } from 'types/contracts';
import { waitForTransaction } from '@wagmi/core';
import { gasLimit } from 'utils/gas';

const WithdrawAtMaturity: FC = () => {
  const { t } = useTranslation();
  const translateOperation = useTranslateOperation();
  const { walletAddress, opts } = useWeb3();

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
    ETHRouterContract,
    rawSlippage,
    setRawSlippage,
    slippage,
  } = useOperationContext();

  const { transaction } = useAnalytics({
    operationInput: useMemo(() => ({ operation, symbol, qty }), [operation, symbol, qty]),
  });

  const handleOperationError = useHandleOperationError();

  const [minAmountToWithdraw, setMinAmountToWithdraw] = useState(0n);
  const [amountToWithdraw, setAmountToWithdraw] = useState(0n);

  const previewerContract = usePreviewer();

  const { marketAccount } = useAccountData(symbol);

  const isEarlyWithdraw = useMemo(() => {
    if (!date) return false;
    return Date.now() / 1000 < date;
  }, [date]);

  const positionAssets = useMemo(() => {
    if (!marketAccount || !date) return 0n;

    const pool = marketAccount.fixedDepositPositions.find(({ maturity }) => maturity === date);
    return pool ? pool.position.principal + pool.position.fee : 0n;
  }, [date, marketAccount]);

  const amountAtFinish = useMemo(
    () => formatUnits(positionAssets, marketAccount?.decimals ?? 18),
    [positionAssets, marketAccount],
  );

  const {
    approve,
    estimateGas: approveEstimateGas,
    isLoading: approveIsLoading,
    needsApproval,
  } = useApprove('withdrawAtMaturity', marketContract as ERC20 | undefined, ETHRouterContract?.address);

  const previewWithdrawAtMaturity = useCallback(async () => {
    if (!marketAccount || !date || !previewerContract) return;

    if (!qty) {
      setMinAmountToWithdraw(0n);
      return;
    }

    const parsedQtyValue = parseUnits(qty, marketAccount.decimals);

    if (parsedQtyValue === 0n) {
      return setErrorData({ status: true, message: t('Cannot withdraw 0') });
    }

    if (parsedQtyValue > positionAssets) {
      return setErrorData({
        status: true,
        message: t(`You can't withdraw more than the deposited amount`),
      });
    }

    const { assets: amount } = await previewerContract.read.previewWithdrawAtMaturity([
      marketAccount.market,
      date,
      parsedQtyValue,
      walletAddress ?? zeroAddress,
    ]);

    setErrorData(undefined);
    setAmountToWithdraw(amount);
    setMinAmountToWithdraw(isEarlyWithdraw ? (amount * slippage) / WEI_PER_ETHER : amount);
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
    previewWithdrawAtMaturity().catch((error) => setErrorData({ status: true, message: handleOperationError(error) }));
  }, [previewWithdrawAtMaturity, errorData?.status, setErrorData, handleOperationError]);

  const estimate = useEstimateGas();

  const previewGasCost = useCallback(
    async (quantity: string): Promise<bigint | undefined> => {
      if (!marketAccount || !walletAddress || !marketContract || !ETHRouterContract || !date || !quantity || !opts)
        return;

      if (await needsApproval(quantity)) {
        return approveEstimateGas();
      }

      const amount = amountToWithdraw;

      if (marketAccount.assetSymbol === 'WETH') {
        const sim = await ETHRouterContract.simulate.withdrawAtMaturity([date, amount, minAmountToWithdraw], opts);
        return estimate(sim.request);
      }

      const sim = await marketContract.simulate.withdrawAtMaturity(
        [date, amount, minAmountToWithdraw, walletAddress, walletAddress],
        opts,
      );
      return estimate(sim.request);
    },
    [
      opts,
      marketAccount,
      walletAddress,
      marketContract,
      ETHRouterContract,
      date,
      needsApproval,
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
    () => setQty(formatUnits(positionAssets, marketAccount?.decimals ?? 18)),
    [marketAccount, positionAssets, setQty],
  );

  const withdraw = useCallback(async () => {
    if (!marketAccount || !date || !marketContract || !walletAddress || !qty || !opts) return;

    let hash;
    setIsLoadingOp(true);
    try {
      transaction.addToCart();
      const amount = parseUnits(qty, marketAccount.decimals);
      if (marketAccount.assetSymbol === 'WETH') {
        if (!ETHRouterContract) return;
        const args = [date, amount, minAmountToWithdraw] as const;

        const gasEstimation = await ETHRouterContract.estimateGas.withdrawAtMaturity(args, opts);
        hash = await ETHRouterContract.write.withdrawAtMaturity(args, {
          ...opts,
          gasLimit: gasLimit(gasEstimation),
        });
      } else {
        const args = [date, amount, minAmountToWithdraw, walletAddress, walletAddress] as const;
        const gasEstimation = await marketContract.estimateGas.withdrawAtMaturity(args, opts);

        hash = await marketContract.write.withdrawAtMaturity(args, {
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
    marketContract,
    walletAddress,
    qty,
    setIsLoadingOp,
    transaction,
    setTx,
    ETHRouterContract,
    minAmountToWithdraw,
    opts,
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

    return withdraw();
  }, [isLoading, requiresApproval, qty, withdraw, approve, setRequiresApproval, needsApproval]);

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
            <ModalBoxCell>{date !== undefined && <ModalInfoMaturityStatus date={Number(date)} />}</ModalBoxCell>
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
                value={formatNumber(formatUnits(amountToWithdraw, decimals), symbol, true)}
                symbol={symbol}
              />
            </ModalBoxCell>
          </ModalBoxRow>
          <ModalBoxRow>
            <ModalBoxCell>
              <ModalInfoHealthFactor qty={qty} symbol={symbol} operation="withdrawAtMaturity" />
            </ModalBoxCell>
          </ModalBoxRow>
        </ModalBox>
      </Grid>

      <Grid item mt={2}>
        {errorData?.component !== 'gas' && <ModalTxCost gasCost={gasCost} />}
        <ModalAdvancedSettings>
          <ModalInfo label={t('Min amount to withdraw')} variant="row">
            {formatNumber(formatUnits(minAmountToWithdraw, decimals), symbol, true)}
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
          label={translateOperation('withdrawAtMaturity', { capitalize: true })}
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
