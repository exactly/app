import { BigNumber, formatFixed, parseFixed } from '@ethersproject/bignumber';
import React, { FC, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { AddressZero, WeiPerEther, Zero } from '@ethersproject/constants';

import ModalGif from 'components/common/modal/ModalGif';
import ModalTxCost from 'components/common/modal/ModalTxCost';

import { MarketContext } from 'contexts/MarketContext';
import { useWeb3 } from 'hooks/useWeb3';

import numbers from 'config/numbers.json';

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

const DEFAULT_AMOUNT = BigNumber.from(numbers.defaultAmount);

const WithdrawAtMaturity: FC = () => {
  const { track } = useAnalytics();
  const { operation } = useModalStatus();
  const { walletAddress } = useWeb3();
  const { date } = useContext(MarketContext);

  const {
    symbol,
    errorData,
    setErrorData,
    qty,
    setQty,
    gasCost,
    tx,
    setTx,
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

  const { marketAccount, refreshAccountData } = useAccountData(symbol);

  const isEarlyWithdraw = useMemo(() => {
    if (!date) return false;
    return Date.now() / 1000 < date;
  }, [date]);

  const positionAssets = useMemo(() => {
    if (!marketAccount || !date) return '0';

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
    if (!marketAccount || !date || !marketContract || !previewerContract) return;

    if (!qty) {
      setMinAmountToWithdraw(Zero);
      return;
    }

    const parsedQtyValue = parseFixed(qty, marketAccount.decimals);
    const { assets: amount } = await previewerContract.previewWithdrawAtMaturity(
      marketContract.address,
      date,
      parsedQtyValue,
      walletAddress ?? AddressZero,
    );

    setAmountToWithdraw(amount);
    setMinAmountToWithdraw(isEarlyWithdraw ? amount.mul(slippage).div(WeiPerEther) : amount);
  }, [marketAccount, date, qty, marketContract, previewerContract, slippage, isEarlyWithdraw, walletAddress]);

  useEffect(() => {
    if (errorData?.status) return;
    previewWithdrawAtMaturity().catch((error) => setErrorData({ status: true, message: handleOperationError(error) }));
  }, [previewWithdrawAtMaturity, errorData?.status, setErrorData, handleOperationError]);

  const previewGasCost = useCallback(
    async (quantity: string): Promise<BigNumber | undefined> => {
      if (!marketAccount || !walletAddress || !marketContract || !ETHRouterContract || !date || !quantity) return;

      const gasPrice = (await ETHRouterContract.provider.getFeeData()).maxFeePerGas;
      if (!gasPrice) return;

      if (requiresApproval) {
        const gasEstimation = await approveEstimateGas();
        return gasEstimation?.mul(gasPrice);
      }

      const amount = amountToWithdraw.isZero() ? DEFAULT_AMOUNT : amountToWithdraw;

      if (marketAccount.assetSymbol === 'WETH') {
        const gasEstimation = await ETHRouterContract.estimateGas.withdrawAtMaturity(date, amount, minAmountToWithdraw);
        return gasPrice.mul(gasEstimation);
      }

      const gasEstimation = await marketContract.estimateGas.withdrawAtMaturity(
        date,
        amount,
        minAmountToWithdraw,
        walletAddress,
        walletAddress,
      );

      return gasPrice.mul(gasEstimation);
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

  const handleInputChange = useCallback(
    (value: string) => {
      setQty(value);

      const parsedValue = parseFixed(value || '0', marketAccount?.decimals ?? 18);

      if (parsedValue.isZero()) {
        return setErrorData({ status: true, message: 'Cannot withdraw 0' });
      }

      if (parsedValue.gt(positionAssets)) {
        return setErrorData({
          status: true,
          message: `You can't withdraw more than the deposited amount`,
        });
      }

      setErrorData(undefined);
    },
    [setQty, positionAssets, setErrorData, marketAccount],
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
          gasLimit: gasEstimation.mul(parseFixed(String(numbers.gasLimitMultiplier), 18)).div(WeiPerEther),
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
            gasLimit: gasEstimation.mul(parseFixed(String(numbers.gasLimitMultiplier), 18)).div(WeiPerEther),
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

      await refreshAccountData();
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
    refreshAccountData,
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
              onChange={handleInputChange}
              label="Deposited"
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
                label="Amount at maturity"
                symbol={symbol}
                value={formatNumber(amountAtFinish, symbol, true)}
              />
            </ModalBoxCell>
            <ModalBoxCell>
              <ModalInfoAmount
                label="Amount to receive"
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
          <ModalInfo label="Min amount to withdraw" variant="row">
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
          <ModalAlert variant="error" message={errorData.message} />
        </Grid>
      )}

      <Grid item mt={{ xs: 2, sm: 3 }}>
        <ModalSubmit
          label="Withdraw"
          symbol={symbol === 'WETH' && marketAccount ? marketAccount.symbol : symbol}
          submit={handleSubmitAction}
          isLoading={isLoading}
          disabled={!qty || parseFloat(qty) <= 0 || isLoading || errorData?.status}
          requiresApproval={requiresApproval}
        />
      </Grid>
    </Grid>
  );
};

export default React.memo(WithdrawAtMaturity);
