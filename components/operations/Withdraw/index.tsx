import React, { FC, useCallback, useMemo, useState } from 'react';
import { BigNumber, formatFixed, parseFixed } from '@ethersproject/bignumber';

import ModalTxCost from 'components/common/modal/ModalTxCost';
import ModalGif from 'components/common/modal/ModalGif';

import { useWeb3 } from 'hooks/useWeb3';

import { WeiPerEther } from '@ethersproject/constants';
import useApprove from 'hooks/useApprove';
import { useOperationContext, usePreviewTx } from 'contexts/OperationContext';
import { Grid } from '@mui/material';
import { ModalBox, ModalBoxCell, ModalBoxRow } from 'components/common/modal/ModalBox';
import AssetInput from 'components/OperationsModal/AssetInput';
import ModalInfoHealthFactor from 'components/OperationsModal/Info/ModalInfoHealthFactor';
import { useModalStatus } from 'contexts/ModalStatusContext';
import ModalInfoTotalDeposits from 'components/OperationsModal/Info/ModalInfoTotalDeposits';
import ModalAdvancedSettings from 'components/common/modal/ModalAdvancedSettings';
import ModalInfoFloatingUtilizationRate from 'components/OperationsModal/Info/ModalInfoFloatingUtilizationRate';
import ModalInfoBorrowLimit from 'components/OperationsModal/Info/ModalInfoBorrowLimit';
import ModalAlert from 'components/common/modal/ModalAlert';
import ModalSubmit from 'components/common/modal/ModalSubmit';
import useAccountData from 'hooks/useAccountData';
import useHandleOperationError from 'hooks/useHandleOperationError';
import useAnalytics from 'hooks/useAnalytics';
import { useTranslation } from 'react-i18next';
import useTranslateOperation from 'hooks/useTranslateOperation';
import { defaultAmount, gasLimitMultiplier } from 'utils/const';

const Withdraw: FC = () => {
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
    requiresApproval,
    setRequiresApproval,
    isLoading: isLoadingOp,
    setIsLoading: setIsLoadingOp,
    marketContract,
    ETHRouterContract,
  } = useOperationContext();

  const handleOperationError = useHandleOperationError();

  const { marketAccount } = useAccountData(symbol);

  const [isMax, setIsMax] = useState(false);

  const parsedAmount = useMemo(() => {
    if (!marketAccount) return '0';
    const { floatingDepositAssets, decimals } = marketAccount;
    return formatFixed(floatingDepositAssets, decimals);
  }, [marketAccount]);

  const {
    approve,
    estimateGas: approveEstimateGas,
    isLoading: approveIsLoading,
    needsApproval,
  } = useApprove('withdraw', marketContract, ETHRouterContract?.address);

  const previewGasCost = useCallback(
    async (quantity: string): Promise<BigNumber | undefined> => {
      if (!walletAddress || !marketContract || !ETHRouterContract || !marketAccount || !quantity) return;

      const gasPrice = (await ETHRouterContract.provider.getFeeData()).maxFeePerGas;
      if (!gasPrice) return;

      if (requiresApproval) {
        const gasEstimation = await approveEstimateGas();
        return gasEstimation?.mul(gasPrice);
      }

      const { floatingDepositShares } = marketAccount;
      if (marketAccount.assetSymbol === 'WETH') {
        const amount = isMax ? floatingDepositShares : quantity ? parseFixed(quantity, 18) : defaultAmount;
        const gasEstimation = await ETHRouterContract.estimateGas.redeem(amount);
        return gasPrice.mul(gasEstimation);
      }

      const amount = isMax
        ? floatingDepositShares
        : quantity
        ? parseFixed(quantity, marketAccount.decimals)
        : defaultAmount;
      const gasEstimation = await marketContract.estimateGas.redeem(amount, walletAddress, walletAddress);
      return gasPrice.mul(gasEstimation);
    },
    [ETHRouterContract, marketAccount, approveEstimateGas, isMax, marketContract, requiresApproval, walletAddress],
  );

  const { isLoading: previewIsLoading } = usePreviewTx({ qty, needsApproval, previewGasCost });

  const isLoading = useMemo(
    () => isLoadingOp || approveIsLoading || previewIsLoading,
    [isLoadingOp, approveIsLoading, previewIsLoading],
  );

  const onMax = useCallback(() => {
    setQty(parsedAmount);
    setIsMax(true);
  }, [parsedAmount, setQty]);

  const handleInputChange = useCallback(
    (value: string) => {
      setQty(value);

      if (parseFloat(value) > parseFloat(parsedAmount)) {
        return setErrorData({
          status: true,
          message: t("You can't withdraw more than the deposited amount"),
        });
      }

      setErrorData(undefined);
      setIsMax(false);
    },
    [parsedAmount, setErrorData, setQty, t],
  );

  const withdraw = useCallback(async () => {
    if (!marketAccount || !walletAddress || !marketContract) return;

    let withdrawTx;
    try {
      setIsLoadingOp(true);
      const { floatingDepositShares, decimals } = marketAccount;

      if (marketAccount.assetSymbol === 'WETH') {
        if (!ETHRouterContract) return;

        if (isMax) {
          const gasEstimation = await ETHRouterContract.estimateGas.redeem(floatingDepositShares);
          withdrawTx = await ETHRouterContract.redeem(floatingDepositShares, {
            gasLimit: gasEstimation.mul(gasLimitMultiplier).div(WeiPerEther),
          });
        } else {
          const gasEstimation = await ETHRouterContract.estimateGas.withdraw(parseFixed(qty, 18));
          withdrawTx = await ETHRouterContract.withdraw(parseFixed(qty, 18), {
            gasLimit: gasEstimation.mul(gasLimitMultiplier).div(WeiPerEther),
          });
        }
      } else {
        if (isMax) {
          const gasEstimation = await marketContract.estimateGas.redeem(
            floatingDepositShares,
            walletAddress,
            walletAddress,
          );

          withdrawTx = await marketContract.redeem(floatingDepositShares, walletAddress, walletAddress, {
            gasLimit: gasEstimation.mul(gasLimitMultiplier).div(WeiPerEther),
          });
        } else {
          const gasEstimation = await marketContract.estimateGas.withdraw(
            parseFixed(qty, decimals),
            walletAddress,
            walletAddress,
          );

          withdrawTx = await marketContract.withdraw(parseFixed(qty, decimals), walletAddress, walletAddress, {
            gasLimit: gasEstimation.mul(gasLimitMultiplier).div(WeiPerEther),
          });
        }
      }

      setTx({ status: 'processing', hash: withdrawTx?.hash });

      const { status, transactionHash } = await withdrawTx.wait();

      setTx({ status: status ? 'success' : 'error', hash: transactionHash });

      void track(status ? 'withdraw' : 'withdrawRevert', {
        amount: qty,
        asset: marketAccount.assetSymbol,
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
    walletAddress,
    marketContract,
    setIsLoadingOp,
    setTx,
    track,
    qty,
    ETHRouterContract,
    isMax,
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

    void track('withdrawRequest', {
      amount: qty,
      asset: symbol,
    });

    return withdraw();
  }, [approve, isLoading, needsApproval, qty, requiresApproval, setRequiresApproval, symbol, track, withdraw]);

  if (tx) return <ModalGif tx={tx} tryAgain={withdraw} />;

  return (
    <Grid container flexDirection="column">
      <Grid item>
        <ModalBox>
          <ModalBoxRow>
            <AssetInput
              qty={qty}
              symbol={symbol}
              decimals={marketAccount?.decimals ?? 18}
              onMax={onMax}
              onChange={handleInputChange}
              label={t('Available')}
              amount={parsedAmount}
            />
          </ModalBoxRow>
          <ModalBoxRow>
            <ModalBoxCell>
              <ModalInfoHealthFactor qty={qty} symbol={symbol} operation={operation} />
            </ModalBoxCell>
            <ModalBoxCell divisor>
              <ModalInfoTotalDeposits qty={qty} symbol={symbol} operation="withdraw" />
            </ModalBoxCell>
          </ModalBoxRow>
        </ModalBox>
      </Grid>

      <Grid item mt={2}>
        {errorData?.component !== 'gas' && <ModalTxCost gasCost={gasCost} />}
        <ModalAdvancedSettings>
          <ModalInfoBorrowLimit qty={qty} symbol={symbol} operation={operation} variant="row" />
          <ModalInfoFloatingUtilizationRate qty={qty} symbol={symbol} operation="withdraw" variant="row" />
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
          symbol={symbol === 'WETH' && marketAccount ? marketAccount.symbol : symbol}
          submit={handleSubmitAction}
          isLoading={isLoading}
          disabled={!qty || parseFloat(qty) <= 0 || isLoading || errorData?.status}
        />
      </Grid>
    </Grid>
  );
};

export default React.memo(Withdraw);
