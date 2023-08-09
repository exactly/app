import React, { useMemo, useState, useCallback } from 'react';

import ModalTxCost from 'components/OperationsModal/ModalTxCost';
import ModalGif from 'components/OperationsModal/ModalGif';

import { useWeb3 } from 'hooks/useWeb3';

import useApprove from 'hooks/useApprove';
import useBalance from 'hooks/useBalance';
import { useOperationContext, usePreviewTx } from 'contexts/OperationContext';
import { Grid } from '@mui/material';
import { ModalBox, ModalBoxCell, ModalBoxRow } from 'components/common/modal/ModalBox';
import AssetInput from 'components/OperationsModal/AssetInput';
import ModalInfoHealthFactor from 'components/OperationsModal/Info/ModalInfoHealthFactor';
import ModalInfoTotalBorrows from 'components/OperationsModal/Info/ModalInfoTotalBorrows';
import ModalAdvancedSettings from 'components/common/modal/ModalAdvancedSettings';
import ModalInfoBorrowLimit from 'components/OperationsModal/Info/ModalInfoBorrowLimit';
import ModalInfoFloatingUtilizationRate from 'components/OperationsModal/Info/ModalInfoFloatingUtilizationRate';
import ModalAlert from 'components/common/modal/ModalAlert';
import ModalSubmit from 'components/OperationsModal/ModalSubmit';
import useAccountData from 'hooks/useAccountData';
import useHandleOperationError from 'hooks/useHandleOperationError';
import useAnalytics from 'hooks/useAnalytics';
import { useTranslation } from 'react-i18next';
import useTranslateOperation from 'hooks/useTranslateOperation';
import { ETH_ROUTER_SLIPPAGE, WEI_PER_ETHER } from 'utils/const';
import { CustomError } from 'types/Error';
import useEstimateGas from 'hooks/useEstimateGas';
import { formatUnits, parseUnits } from 'viem';
import { waitForTransaction } from '@wagmi/core';
import { gasLimit } from 'utils/gas';

function Repay() {
  const { t } = useTranslation();
  const translateOperation = useTranslateOperation();
  const { walletAddress, opts } = useWeb3();

  const {
    operation,
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
    assetContract,
    ETHRouterContract,
  } = useOperationContext();

  const { transaction } = useAnalytics({
    operationInput: useMemo(() => ({ operation, symbol, qty }), [operation, symbol, qty]),
  });

  const handleOperationError = useHandleOperationError();

  const { marketAccount } = useAccountData(symbol);

  const [isMax, setIsMax] = useState(false);

  const walletBalance = useBalance(symbol, assetContract?.address);

  const finalAmount = useMemo(() => {
    if (!marketAccount) return '0';
    return formatUnits(marketAccount.floatingBorrowAssets, marketAccount.decimals);
  }, [marketAccount]);

  const {
    approve,
    estimateGas: approveEstimateGas,
    isLoading: approveIsLoading,
    needsApproval,
  } = useApprove('repay', assetContract, marketAccount?.market);

  const onMax = useCallback(() => {
    setQty(finalAmount);

    setIsMax(true);

    if (walletBalance && parseFloat(finalAmount) > parseFloat(walletBalance)) {
      return setErrorData({
        status: true,
        message: t("You can't repay more than you have in your wallet"),
        component: 'input',
      });
    }

    setErrorData(undefined);
  }, [setQty, finalAmount, walletBalance, setErrorData, t]);

  const handleInputChange = useCallback(
    (value: string) => {
      setQty(value);

      if (walletBalance && parseFloat(value) > parseFloat(walletBalance)) {
        return setErrorData({
          status: true,
          message: t("You can't repay more than you have in your wallet"),
          component: 'input',
        });
      }

      setErrorData(undefined);
      setIsMax(value === finalAmount);
    },
    [setQty, walletBalance, setErrorData, finalAmount, t],
  );

  const repay = useCallback(async () => {
    if (!marketAccount || !qty || !marketContract || !walletAddress || !opts) return;

    let hash;
    setIsLoadingOp(true);
    try {
      transaction.addToCart();
      const { floatingBorrowShares, floatingBorrowAssets, decimals } = marketAccount;

      const amount = parseUnits(qty, decimals);
      if (marketAccount.assetSymbol === 'WETH') {
        if (!ETHRouterContract) return;

        if (isMax) {
          const args = [floatingBorrowShares] as const;
          const gasEstimation = await ETHRouterContract.estimateGas.refund(args, {
            ...opts,
            value: (floatingBorrowAssets * ETH_ROUTER_SLIPPAGE) / WEI_PER_ETHER,
          });

          hash = await ETHRouterContract.write.refund(args, {
            ...opts,
            value: (floatingBorrowAssets * ETH_ROUTER_SLIPPAGE) / WEI_PER_ETHER,
            gasLimit: gasLimit(gasEstimation),
          });
        } else {
          const args = [amount] as const;
          const gasEstimation = await ETHRouterContract.estimateGas.repay(args, {
            ...opts,
            value: (amount * ETH_ROUTER_SLIPPAGE) / WEI_PER_ETHER,
          });

          hash = await ETHRouterContract.write.repay(args, {
            ...opts,
            value: (amount * ETH_ROUTER_SLIPPAGE) / WEI_PER_ETHER,
            gasLimit: gasLimit(gasEstimation),
          });
        }
      } else {
        if (isMax) {
          const args = [floatingBorrowAssets, walletAddress] as const;
          const gasEstimation = await marketContract.estimateGas.refund(args, opts);
          hash = await marketContract.write.refund(args, {
            ...opts,
            gasLimit: gasLimit(gasEstimation),
          });
        } else {
          const args = [amount, walletAddress] as const;
          const gasEstimation = await marketContract.estimateGas.repay(args, opts);
          hash = await marketContract.write.repay(args, {
            ...opts,
            gasLimit: gasLimit(gasEstimation),
          });
        }
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
    qty,
    marketContract,
    walletAddress,
    opts,
    setIsLoadingOp,
    transaction,
    setTx,
    ETHRouterContract,
    isMax,
    setErrorData,
    handleOperationError,
  ]);

  const estimate = useEstimateGas();

  const previewGasCost = useCallback(
    async (quantity: string): Promise<bigint | undefined> => {
      if (!marketAccount || !walletAddress || !ETHRouterContract || !marketContract || !quantity || !opts) return;

      if (await needsApproval(quantity)) {
        return approveEstimateGas();
      }

      if (marketAccount.assetSymbol === 'WETH') {
        const value = (parseUnits(quantity, marketAccount.decimals) * ETH_ROUTER_SLIPPAGE) / WEI_PER_ETHER;
        const amount = isMax ? marketAccount.floatingBorrowShares : value;

        const sim = isMax
          ? await ETHRouterContract.simulate.refund([amount], { ...opts, value })
          : await ETHRouterContract.simulate.repay([amount], {
              ...opts,
              value,
            });
        const gasEstimation = await estimate(sim.request);
        if (amount + (gasEstimation ?? 0n) >= parseUnits(walletBalance || '0', 18)) {
          throw new CustomError(t('Reserve ETH for gas fees.'), 'warning');
        }
        return gasEstimation;
      }

      const sim = isMax
        ? await marketContract.simulate.refund([marketAccount.floatingBorrowShares, walletAddress], opts)
        : await marketContract.simulate.repay([parseUnits(quantity, marketAccount.decimals), walletAddress], opts);
      return estimate(sim.request);
    },
    [
      marketAccount,
      walletAddress,
      ETHRouterContract,
      marketContract,
      opts,
      needsApproval,
      isMax,
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
              label={t('Your balance')}
              amount={walletBalance}
            />
          </ModalBoxRow>
          <ModalBoxRow>
            <ModalBoxCell>
              <ModalInfoHealthFactor qty={qty} symbol={symbol} operation={operation} />
            </ModalBoxCell>
            <ModalBoxCell divisor>
              <ModalInfoTotalBorrows qty={qty} symbol={symbol} operation="repay" />
            </ModalBoxCell>
          </ModalBoxRow>
        </ModalBox>
      </Grid>

      <Grid item mt={2}>
        {errorData?.component !== 'gas' && <ModalTxCost gasCost={gasCost} />}
        <ModalAdvancedSettings>
          <ModalInfoBorrowLimit qty={qty} symbol={symbol} operation={operation} variant="row" />
          <ModalInfoFloatingUtilizationRate qty={qty} symbol={symbol} operation="repay" variant="row" />
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
          symbol={symbol}
          submit={handleSubmitAction}
          isLoading={isLoading}
          disabled={!qty || parseFloat(qty) <= 0 || isLoading || errorData?.status}
        />
      </Grid>
    </Grid>
  );
}

export default React.memo(Repay);
