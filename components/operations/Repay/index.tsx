import React, { ChangeEvent, useContext, useMemo, useState, useCallback } from 'react';
import { BigNumber, formatFixed, parseFixed } from '@ethersproject/bignumber';
import { WeiPerEther } from '@ethersproject/constants';
import { LoadingButton } from '@mui/lab';

import ModalAsset from 'components/common/modal/ModalAsset';
import ModalInput from 'components/common/modal/ModalInput';
import ModalRowHealthFactor from 'components/common/modal/ModalRowHealthFactor';
import ModalTitle from 'components/common/modal/ModalTitle';
import ModalTxCost from 'components/common/modal/ModalTxCost';
import ModalGif from 'components/common/modal/ModalGif';
import ModalError from 'components/common/modal/ModalError';
import ModalRowBorrowLimit from 'components/common/modal/ModalRowBorrowLimit';

import { LangKeys } from 'types/Lang';

import LangContext from 'contexts/LangContext';
import { useWeb3 } from 'hooks/useWeb3';
import AccountDataContext from 'contexts/AccountDataContext';
import { MarketContext } from 'contexts/MarketContext';

import numbers from 'config/numbers.json';

import keys from './translations.json';
import useApprove from 'hooks/useApprove';
import useMarket from 'hooks/useMarket';
import useETHRouter from 'hooks/useETHRouter';
import handleOperationError from 'utils/handleOperationError';
import useERC20 from 'hooks/useERC20';
import useBalance from 'hooks/useBalance';
import analytics from 'utils/analytics';
import { useOperationContext, usePreviewTx } from 'contexts/OperationContext';

const DEFAULT_AMOUNT = BigNumber.from(numbers.defaultAmount);

function Repay() {
  const { walletAddress } = useWeb3();
  const { accountData, getAccountData } = useContext(AccountDataContext);
  const { market } = useContext(MarketContext);

  const lang: string = useContext(LangContext);
  const translations: { [key: string]: LangKeys } = keys;

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
  } = useOperationContext();

  const [isMax, setIsMax] = useState(false);

  const ETHRouterContract = useETHRouter();

  const marketContract = useMarket(market);
  const assetContract = useERC20();

  const walletBalance = useBalance(symbol, assetContract);

  const finalAmount = useMemo(() => {
    if (!accountData) return '0';
    return formatFixed(accountData[symbol].floatingBorrowAssets, accountData[symbol].decimals);
  }, [accountData, symbol]);

  const {
    approve,
    estimateGas: approveEstimateGas,
    isLoading: approveIsLoading,
    needsApproval,
  } = useApprove('repay', assetContract, marketContract?.address);

  const onMax = useCallback(() => {
    setQty(finalAmount);

    setIsMax(true);

    if (walletBalance && parseFloat(finalAmount) > parseFloat(walletBalance)) {
      return setErrorData({
        status: true,
        message: translations[lang].insufficientBalance,
        component: 'input',
      });
    }

    setErrorData(undefined);
  }, [setQty, finalAmount, walletBalance, setErrorData, translations, lang]);

  const handleInputChange = useCallback(
    ({ target: { value, valueAsNumber } }: ChangeEvent<HTMLInputElement>) => {
      setQty(value);

      if (walletBalance && valueAsNumber > parseFloat(walletBalance)) {
        return setErrorData({
          status: true,
          message: translations[lang].insufficientBalance,
          component: 'input',
        });
      }

      setErrorData(undefined);
      setIsMax(false);
    },
    [setQty, walletBalance, setErrorData, translations, lang],
  );

  const repay = useCallback(async () => {
    if (!accountData || !qty || !marketContract || !walletAddress) return;

    let repayTx;
    try {
      setIsLoadingOp(true);
      const { decimals, floatingBorrowShares, floatingBorrowAssets } = accountData[symbol];

      if (symbol === 'WETH') {
        if (!ETHRouterContract) return;

        if (isMax) {
          const gasEstimation = await ETHRouterContract.estimateGas.refund(floatingBorrowShares, {
            value: floatingBorrowAssets.mul(parseFixed(String(1 + numbers.slippage), 18)).div(WeiPerEther),
          });

          repayTx = await ETHRouterContract.refund(floatingBorrowShares, {
            gasLimit: gasEstimation.mul(parseFixed(String(numbers.gasLimitMultiplier), 18)).div(WeiPerEther),
            value: floatingBorrowAssets.mul(parseFixed(String(1 + numbers.slippage), 18)).div(WeiPerEther),
          });
        } else {
          const gasEstimation = await ETHRouterContract.estimateGas.repay(parseFixed(qty, 18), {
            value: parseFixed(qty, 18)
              .mul(parseFixed(String(1 + numbers.slippage), 18))
              .div(WeiPerEther),
          });

          repayTx = await ETHRouterContract.repay(parseFixed(qty, 18), {
            gasLimit: gasEstimation.mul(parseFixed(String(numbers.gasLimitMultiplier), 18)).div(WeiPerEther),
            value: parseFixed(qty, 18)
              .mul(parseFixed(String(1 + numbers.slippage), 18))
              .div(WeiPerEther),
          });
        }
      } else {
        if (isMax) {
          const gasEstimation = await marketContract.estimateGas.refund(floatingBorrowShares, walletAddress);

          repayTx = await marketContract.refund(floatingBorrowShares, walletAddress, {
            gasLimit: gasEstimation.mul(parseFixed(String(numbers.gasLimitMultiplier), 18)).div(WeiPerEther),
          });
        } else {
          const gasEstimation = await marketContract.estimateGas.repay(parseFixed(qty, decimals), walletAddress);
          repayTx = await marketContract.repay(parseFixed(qty, decimals), walletAddress, {
            gasLimit: gasEstimation.mul(parseFixed(String(numbers.gasLimitMultiplier), 18)).div(WeiPerEther),
          });
        }
      }

      setTx({ status: 'processing', hash: repayTx?.hash });

      const { status, transactionHash } = await repayTx.wait();

      setTx({ status: status ? 'success' : 'error', hash: transactionHash });

      void analytics.track(status ? 'repay' : 'repayRevert', {
        amount: qty,
        asset: symbol,
        hash: transactionHash,
      });

      void getAccountData();
    } catch (error: any) {
      if (repayTx) setTx({ status: 'error', hash: repayTx?.hash });
      setErrorData({ status: true, message: handleOperationError(error) });
    } finally {
      setIsLoadingOp(false);
    }
  }, [
    ETHRouterContract,
    accountData,
    getAccountData,
    isMax,
    marketContract,
    qty,
    setErrorData,
    setIsLoadingOp,
    setTx,
    symbol,
    walletAddress,
  ]);

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
        const amount = quantity
          ? parseFixed(quantity, 18)
              .mul(parseFixed(String(1 + numbers.slippage), 18))
              .div(WeiPerEther)
          : DEFAULT_AMOUNT;

        const gasLimit = await ETHRouterContract.estimateGas.repay(amount, {
          value: amount,
        });

        return gasPrice.mul(gasLimit);
      }

      const decimals = await marketContract.decimals();
      const gasLimit = await marketContract.estimateGas.repay(
        quantity ? parseFixed(quantity, decimals) : DEFAULT_AMOUNT,
        walletAddress,
      );

      return gasPrice.mul(gasLimit);
    },
    [walletAddress, ETHRouterContract, marketContract, requiresApproval, symbol, approveEstimateGas],
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

    void analytics.track('repayRequest', {
      amount: qty,
      asset: symbol,
    });

    return repay();
  }, [approve, isLoading, needsApproval, qty, repay, requiresApproval, setRequiresApproval, symbol]);

  if (tx) return <ModalGif tx={tx} tryAgain={repay} />;

  return (
    <>
      <ModalTitle title={translations[lang].lateRepay} />
      <ModalAsset
        asset={symbol}
        assetTitle={translations[lang].action.toUpperCase()}
        amount={finalAmount}
        amountTitle={translations[lang].debtAmount.toUpperCase()}
      />
      <ModalInput
        onMax={onMax}
        value={qty}
        onChange={handleInputChange}
        symbol={symbol}
        error={errorData?.component === 'input'}
      />
      {errorData?.component !== 'gas' && <ModalTxCost gasCost={gasCost} />}
      <ModalRowHealthFactor qty={qty} symbol={symbol} operation="repay" />
      <ModalRowBorrowLimit qty={qty} symbol={symbol} operation="repay" line />
      {errorData && <ModalError message={errorData.message} />}
      <LoadingButton
        fullWidth
        sx={{ mt: 2 }}
        variant="contained"
        color="primary"
        onClick={handleSubmitAction}
        loading={isLoading}
        disabled={!qty || parseFloat(qty) <= 0 || isLoading || errorData?.status}
      >
        {requiresApproval ? translations[lang].approval : translations[lang].repay}
      </LoadingButton>
    </>
  );
}

export default React.memo(Repay);
