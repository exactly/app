import React, { ChangeEvent, useContext, useEffect, useMemo, useState, useCallback } from 'react';
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
import { Transaction } from 'types/Transaction';
import { ErrorData } from 'types/Error';

import { getSymbol } from 'utils/utils';

import LangContext from 'contexts/LangContext';
import { useWeb3Context } from 'contexts/Web3Context';
import AccountDataContext from 'contexts/AccountDataContext';
import { MarketContext } from 'contexts/MarketContext';

import numbers from 'config/numbers.json';

import keys from './translations.json';
import useApprove from 'hooks/useApprove';
import useMarket from 'hooks/useMarket';
import useETHRouter from 'hooks/useETHRouter';
import handleOperationError from 'utils/handleOperationError';
import useERC20 from 'hooks/useERC20';
import useDebounce from 'hooks/useDebounce';
import useBalance from 'hooks/useBalance';

const DEFAULT_AMOUNT = BigNumber.from(numbers.defaultAmount);

function Repay() {
  const { walletAddress, network } = useWeb3Context();
  const { accountData, getAccountData } = useContext(AccountDataContext);
  const { market } = useContext(MarketContext);

  const lang: string = useContext(LangContext);
  const translations: { [key: string]: LangKeys } = keys;

  const [qty, setQty] = useState<string>('');

  const [gasCost, setGasCost] = useState<BigNumber | undefined>();
  const [tx, setTx] = useState<Transaction | undefined>();
  const [isLoadingOp, setIsLoadingOp] = useState(false);
  const [needsAllowance, setNeedsAllowance] = useState(false);
  const [isMax, setIsMax] = useState(false);
  const [errorData, setErrorData] = useState<ErrorData | undefined>();
  const [assetAddress, setAssetAddress] = useState<string | undefined>();

  const debounceQty = useDebounce(qty);
  const ETHRouterContract = useETHRouter();

  const marketContract = useMarket(market?.value);
  const assetContract = useERC20(assetAddress);

  const symbol = useMemo(() => {
    return market?.value ? getSymbol(market.value, network?.name) : 'DAI';
  }, [market?.value, network?.name]);

  const walletBalance = useBalance(symbol, assetContract);

  useEffect(() => {
    if (!marketContract || symbol === 'WETH') return;

    const loadAssetAddress = async () => {
      setAssetAddress(await marketContract.asset());
    };
    void loadAssetAddress();
  }, [marketContract, symbol]);

  const finalAmount = useMemo(() => {
    if (!accountData) return '0';
    return formatFixed(accountData[symbol].floatingBorrowAssets, accountData[symbol].decimals);
  }, [accountData, symbol]);

  useEffect(() => {
    setQty('');
    setErrorData(undefined);
  }, [symbol]);

  const {
    approve,
    estimateGas: approveEstimateGas,
    isLoading: approveIsLoading,
    errorData: approveErrorData,
  } = useApprove(assetContract, marketContract?.address);

  const isLoading = useMemo(() => isLoadingOp || approveIsLoading, [isLoadingOp, approveIsLoading]);

  const needsApproval = useCallback(async () => {
    if (symbol === 'WETH') return false;

    if (!walletAddress || !assetContract || !marketContract || !accountData) return true;

    const decimals = await assetContract.decimals();
    const allowance = await assetContract.allowance(walletAddress, marketContract.address);
    return allowance.lt(parseFixed(qty || String(numbers.defaultAmount), decimals));
  }, [accountData, assetContract, marketContract, qty, symbol, walletAddress]);

  useEffect(() => {
    needsApproval()
      .then(setNeedsAllowance)
      .catch((error) => setErrorData({ status: true, message: handleOperationError(error) }));
  }, [needsApproval]);

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
  }, [finalAmount, walletBalance, translations, lang]);

  const handleInputChange = useCallback(
    ({ target: { value, valueAsNumber } }: ChangeEvent<HTMLInputElement>) => {
      if (!accountData || !symbol) return;
      const { decimals } = accountData[symbol];

      if (value.includes('.')) {
        const regex = /[^,.]*$/g;
        const inputDecimals = regex.exec(value)![0];
        if (inputDecimals.length > decimals) return; //limit the number of decimals on the input
      }

      setQty(value);

      if (walletBalance && valueAsNumber > parseFloat(walletBalance)) {
        return setErrorData({
          status: true,
          message: translations[lang].insufficientBalance,
          component: 'input',
        });
      }
      setErrorData(undefined);

      isMax && setIsMax(false);
    },
    [accountData, symbol, walletBalance, isMax, translations, lang],
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

      getAccountData();
    } catch (error: any) {
      if (repayTx) setTx({ status: 'error', hash: repayTx?.hash });
      setErrorData({ status: true, message: handleOperationError(error) });
    } finally {
      setIsLoadingOp(false);
    }
  }, [ETHRouterContract, accountData, getAccountData, isMax, marketContract, qty, symbol, walletAddress]);

  const previewGasCost = useCallback(async () => {
    if (isLoading || !walletAddress || !ETHRouterContract || !marketContract) return;

    const gasPrice = (await ETHRouterContract.provider.getFeeData()).maxFeePerGas;
    if (!gasPrice) return;

    if (await needsApproval()) {
      const gasEstimation = await approveEstimateGas();
      return setGasCost(gasEstimation ? gasEstimation.mul(gasPrice) : undefined);
    }

    if (symbol === 'WETH') {
      const amount = debounceQty
        ? parseFixed(debounceQty, 18)
            .mul(parseFixed(String(1 + numbers.slippage), 18))
            .div(WeiPerEther)
        : DEFAULT_AMOUNT;

      const gasLimit = await ETHRouterContract.estimateGas.repay(amount, {
        value: amount,
      });

      return setGasCost(gasPrice.mul(gasLimit));
    }

    const decimals = await marketContract.decimals();
    const gasLimit = await marketContract.estimateGas.repay(
      debounceQty ? parseFixed(debounceQty, decimals) : DEFAULT_AMOUNT,
      walletAddress,
    );

    setGasCost(gasPrice.mul(gasLimit));
  }, [
    ETHRouterContract,
    approveEstimateGas,
    debounceQty,
    isLoading,
    marketContract,
    needsApproval,
    symbol,
    walletAddress,
  ]);

  useEffect(() => {
    if (errorData?.status) return;
    previewGasCost().catch((error) => {
      setErrorData({
        status: true,
        message: handleOperationError(error),
        component: 'gas',
      });
    });
  }, [lang, previewGasCost, translations, errorData?.status]);

  const handleSubmitAction = useCallback(async () => {
    if (isLoading) return;
    if (needsAllowance) {
      await approve();
      setErrorData(approveErrorData);
      setNeedsAllowance(await needsApproval());
      return;
    }

    return repay();
  }, [approve, approveErrorData, isLoading, needsAllowance, needsApproval, repay]);

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
      <ModalInput onMax={onMax} value={qty} onChange={handleInputChange} symbol={symbol} />
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
        {needsAllowance ? translations[lang].approval : translations[lang].repay}
      </LoadingButton>
    </>
  );
}

export default Repay;
