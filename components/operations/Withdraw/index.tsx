import React, { FC, useCallback, useMemo, useState } from 'react';

import ModalTxCost from 'components/OperationsModal/ModalTxCost';
import ModalGif from 'components/OperationsModal/ModalGif';

import { useWeb3 } from 'hooks/useWeb3';

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
import ModalSubmit from 'components/OperationsModal/ModalSubmit';
import useAccountData from 'hooks/useAccountData';
import useHandleOperationError from 'hooks/useHandleOperationError';
import useAnalytics from 'hooks/useAnalytics';
import { useTranslation } from 'react-i18next';
import useTranslateOperation from 'hooks/useTranslateOperation';
import { GAS_LIMIT_MULTIPLIER, WEI_PER_ETHER } from 'utils/const';
import useEstimateGas from 'hooks/useEstimateGas';
import { formatUnits, parseUnits } from 'viem';
import { ERC20 } from 'types/contracts';
import { waitForTransaction } from '@wagmi/core';

const Withdraw: FC = () => {
  const { t } = useTranslation();
  const translateOperation = useTranslateOperation();
  const { transaction } = useAnalytics();
  const { operation } = useModalStatus();
  const { walletAddress, opts } = useWeb3();

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
    return formatUnits(floatingDepositAssets, decimals);
  }, [marketAccount]);

  const {
    approve,
    estimateGas: approveEstimateGas,
    isLoading: approveIsLoading,
    needsApproval,
  } = useApprove('withdraw', marketContract as ERC20 | undefined, ETHRouterContract?.address);

  const estimate = useEstimateGas();

  const previewGasCost = useCallback(
    async (quantity: string): Promise<bigint | undefined> => {
      if (!walletAddress || !marketContract || !ETHRouterContract || !marketAccount || !quantity || !opts) return;

      if (await needsApproval(quantity)) {
        return approveEstimateGas();
      }
      const { floatingDepositShares } = marketAccount;

      const amount = isMax ? floatingDepositShares : parseUnits(quantity as `${number}`, marketAccount.decimals);
      if (marketAccount.assetSymbol === 'WETH') {
        const sim = await ETHRouterContract.simulate.redeem([amount], opts);
        return estimate(sim.request);
      }

      const sim = await marketContract.simulate.redeem([amount, walletAddress, walletAddress], opts);
      return estimate(sim.request);
    },
    [
      walletAddress,
      marketContract,
      ETHRouterContract,
      marketAccount,
      needsApproval,
      isMax,
      estimate,
      approveEstimateGas,
      opts,
    ],
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
      if (!marketAccount) return;

      setQty(value);

      const parsed = parseUnits((value as `${number}`) || '0', marketAccount.decimals);

      if (parsed > marketAccount.floatingDepositAssets) {
        return setErrorData({
          status: true,
          message: t("You can't withdraw more than the deposited amount"),
        });
      }

      setErrorData(undefined);

      setIsMax(value === parsedAmount);
    },
    [marketAccount, parsedAmount, setErrorData, setQty, t],
  );

  const withdraw = useCallback(async () => {
    if (!marketAccount || !walletAddress || !marketContract || !opts) return;

    let hash;
    setIsLoadingOp(true);
    try {
      transaction.addToCart();
      const { floatingDepositShares, decimals } = marketAccount;

      const amount = parseUnits(qty as `${number}`, decimals);

      if (marketAccount.assetSymbol === 'WETH') {
        if (!ETHRouterContract) return;

        if (isMax) {
          const args = [floatingDepositShares] as const;
          const gasEstimation = await ETHRouterContract.estimateGas.redeem(args, opts);
          hash = await ETHRouterContract.write.redeem(args, {
            ...opts,
            gasLimit: (gasEstimation * GAS_LIMIT_MULTIPLIER) / WEI_PER_ETHER,
          });
        } else {
          const args = [amount] as const;
          const gasEstimation = await ETHRouterContract.estimateGas.withdraw(args, opts);
          hash = await ETHRouterContract.write.withdraw(args, {
            ...opts,
            gasLimit: (gasEstimation * GAS_LIMIT_MULTIPLIER) / WEI_PER_ETHER,
          });
        }
      } else {
        if (isMax) {
          const args = [floatingDepositShares, walletAddress, walletAddress] as const;
          const gasEstimation = await marketContract.estimateGas.redeem(args, opts);
          hash = await marketContract.write.redeem(args, {
            ...opts,
            gasLimit: (gasEstimation * GAS_LIMIT_MULTIPLIER) / WEI_PER_ETHER,
          });
        } else {
          const args = [amount, walletAddress, walletAddress] as const;
          const gasEstimation = await marketContract.estimateGas.withdraw(args, opts);
          hash = await marketContract.write.withdraw(args, {
            ...opts,
            gasLimit: (gasEstimation * GAS_LIMIT_MULTIPLIER) / WEI_PER_ETHER,
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
    walletAddress,
    marketContract,
    opts,
    setIsLoadingOp,
    transaction,
    qty,
    setTx,
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

    return withdraw();
  }, [approve, isLoading, needsApproval, qty, requiresApproval, setRequiresApproval, withdraw]);

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

export default React.memo(Withdraw);
