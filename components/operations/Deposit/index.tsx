import React, { FC, useCallback, useContext, useMemo } from 'react';
import { BigNumber, formatFixed, parseFixed } from '@ethersproject/bignumber';
import { WeiPerEther } from '@ethersproject/constants';

import ModalTxCost from 'components/common/modal/ModalTxCost';
import ModalGif from 'components/common/modal/ModalGif';

import { LangKeys } from 'types/Lang';

import LangContext from 'contexts/LangContext';
import { useWeb3 } from 'hooks/useWeb3';
import AccountDataContext from 'contexts/AccountDataContext';

import keys from './translations.json';
import numbers from 'config/numbers.json';
import useApprove from 'hooks/useApprove';
import useBalance from 'hooks/useBalance';
import handleOperationError from 'utils/handleOperationError';
import analytics from 'utils/analytics';
import useAccountData from 'hooks/useAccountData';
import { useOperationContext, usePreviewTx } from 'contexts/OperationContext';
import { ModalBox, ModalBoxRow, ModalBoxCell } from 'components/common/modal/ModalBox';
import { useModalStatus } from 'contexts/ModalStatusContext';
import ModalInfoHealthFactor from 'components/OperationsModal/Info/ModalInfoHealthFactor';
import ModalInfoBorrowLimit from 'components/OperationsModal/Info/ModalInfoBorrowLimit';
import { Grid } from '@mui/material';
import AssetInput from 'components/OperationsModal/AssetInput';
import ModalAdvancedSettings from 'components/common/modal/ModalAdvancedSettings';
import ModalSubmit from 'components/common/modal/ModalSubmit';
import ModalAlert from 'components/common/modal/ModalAlert';
import ModalInfoTotalDeposits from 'components/OperationsModal/Info/ModalInfoTotalDeposits';
import ModalInfoFloatingUtilizationRate from 'components/OperationsModal/Info/ModalInfoFloatingUtilizationRate';

const DEFAULT_AMOUNT = BigNumber.from(numbers.defaultAmount);

const Deposit: FC = () => {
  const { operation } = useModalStatus();
  const { walletAddress } = useWeb3();
  const { getAccountData } = useContext(AccountDataContext);

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
    assetContract,
    ETHRouterContract,
  } = useOperationContext();

  const lang: string = useContext(LangContext);
  const translations: { [key: string]: LangKeys } = keys;

  const { decimals = 18 } = useAccountData(symbol);

  const walletBalance = useBalance(symbol, assetContract);

  const {
    approve,
    estimateGas: approveEstimateGas,
    isLoading: approveIsLoading,
    needsApproval,
  } = useApprove('deposit', assetContract, marketContract?.address);

  const previewGasCost = useCallback(
    async (quantity: string): Promise<BigNumber | undefined> => {
      if (!walletAddress || !ETHRouterContract || !marketContract) return;

      const gasPrice = (await ETHRouterContract.provider.getFeeData()).maxFeePerGas;
      if (!gasPrice) return;

      if (requiresApproval) {
        const gasEstimation = await approveEstimateGas();
        return gasEstimation?.mul(gasPrice);
      }

      if (symbol === 'WETH') {
        const gasLimit = await ETHRouterContract.estimateGas.deposit({
          value: quantity ? parseFixed(quantity, 18) : DEFAULT_AMOUNT,
        });

        return gasPrice.mul(gasLimit);
      }

      const gasLimit = await marketContract.estimateGas.deposit(
        quantity ? parseFixed(quantity, decimals) : DEFAULT_AMOUNT,
        walletAddress,
      );

      return gasPrice.mul(gasLimit);
    },
    [decimals, ETHRouterContract, approveEstimateGas, marketContract, requiresApproval, symbol, walletAddress],
  );

  const { isLoading: previewIsLoading } = usePreviewTx({ qty, needsApproval, previewGasCost });

  const isLoading = useMemo(
    () => approveIsLoading || isLoadingOp || previewIsLoading,
    [approveIsLoading, isLoadingOp, previewIsLoading],
  );

  const onMax = useCallback(() => {
    if (walletBalance) {
      setQty(walletBalance);
      setErrorData(undefined);
    }
  }, [walletBalance, setQty, setErrorData]);

  const handleInputChange = useCallback(
    (value: string) => {
      setQty(value);

      if (walletBalance && parseFloat(value) > parseFloat(walletBalance)) {
        return setErrorData({
          status: true,
          message: translations[lang].insufficientBalance,
          component: 'input',
        });
      }

      setErrorData(undefined);
    },
    [setQty, walletBalance, setErrorData, translations, lang],
  );

  const deposit = useCallback(async () => {
    if (!walletAddress || !marketContract) return;
    let depositTx;
    try {
      setIsLoadingOp(true);
      if (symbol === 'WETH') {
        if (!ETHRouterContract) return;

        const gasEstimation = await ETHRouterContract.estimateGas.deposit({ value: parseFixed(qty, 18) });

        depositTx = await ETHRouterContract.deposit({
          value: parseFixed(qty, 18),
          gasLimit: gasEstimation.mul(parseFixed(String(numbers.gasLimitMultiplier), 18)).div(WeiPerEther),
        });
      } else {
        const depositAmount = parseFixed(qty, decimals);
        const gasEstimation = await marketContract.estimateGas.deposit(depositAmount, walletAddress);

        depositTx = await marketContract.deposit(depositAmount, walletAddress, {
          gasLimit: Math.ceil(Number(formatFixed(gasEstimation)) * numbers.gasLimitMultiplier),
        });
      }

      setTx({ status: 'processing', hash: depositTx.hash });

      const { status, transactionHash } = await depositTx.wait();

      setTx({ status: status ? 'success' : 'error', hash: transactionHash });

      void analytics.track(status ? 'deposit' : 'depositRevert', {
        amount: qty,
        asset: symbol,
        hash: transactionHash,
      });

      void getAccountData();
    } catch (error: any) {
      if (depositTx) setTx({ status: 'error', hash: depositTx.hash });
      setErrorData({ status: true, message: handleOperationError(error) });
    } finally {
      setIsLoadingOp(false);
    }
  }, [
    walletAddress,
    marketContract,
    setIsLoadingOp,
    symbol,
    setTx,
    qty,
    getAccountData,
    ETHRouterContract,
    decimals,
    setErrorData,
  ]);

  const handleSubmitAction = useCallback(async () => {
    if (isLoading) return;
    if (requiresApproval) {
      await approve();
      setRequiresApproval(await needsApproval(qty));
      return;
    }

    void analytics.track('depositRequest', {
      amount: qty,
      asset: symbol,
    });

    return deposit();
  }, [isLoading, requiresApproval, qty, symbol, deposit, approve, setRequiresApproval, needsApproval]);

  if (tx) return <ModalGif tx={tx} tryAgain={deposit} />;

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
              label="Wallet balance"
              amount={walletBalance}
            />
          </ModalBoxRow>
          <ModalBoxRow>
            <ModalBoxCell>
              <ModalInfoHealthFactor qty={qty} symbol={symbol} operation={operation} />
            </ModalBoxCell>
            <ModalBoxCell divisor>
              <ModalInfoBorrowLimit qty={qty} symbol={symbol} operation={operation} />
            </ModalBoxCell>
          </ModalBoxRow>
        </ModalBox>
      </Grid>

      <Grid item mt={2}>
        {errorData?.component !== 'gas' && <ModalTxCost gasCost={gasCost} />}
        <ModalAdvancedSettings>
          <ModalInfoTotalDeposits qty={qty} symbol={symbol} operation="deposit" variant="row" />
          <ModalInfoFloatingUtilizationRate qty={qty} symbol={symbol} operation="deposit" variant="row" />
        </ModalAdvancedSettings>
      </Grid>

      {errorData?.status && (
        <Grid item mt={2}>
          <ModalAlert variant="error" message={errorData.message} />
        </Grid>
      )}

      <Grid item mt={4}>
        <ModalSubmit
          label="Deposit"
          symbol={symbol}
          submit={handleSubmitAction}
          isLoading={isLoading}
          disabled={!qty || parseFloat(qty) <= 0 || isLoading || errorData?.status}
          requiresApproval={requiresApproval}
        />
      </Grid>
    </Grid>
  );
};

export default React.memo(Deposit);
