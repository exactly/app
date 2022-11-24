import React, { ChangeEvent, FC, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { BigNumber, formatFixed, parseFixed } from '@ethersproject/bignumber';

import ModalAsset from 'components/common/modal/ModalAsset';
import ModalInput from 'components/common/modal/ModalInput';
import ModalRow from 'components/common/modal/ModalRow';
import ModalRowHealthFactor from 'components/common/modal/ModalRowHealthFactor';
import ModalTitle from 'components/common/modal/ModalTitle';
import ModalTxCost from 'components/common/modal/ModalTxCost';
import ModalGif from 'components/common/modal/ModalGif';
import ModalError from 'components/common/modal/ModalError';
import ModalRowBorrowLimit from 'components/common/modal/ModalRowBorrowLimit';

import { LangKeys } from 'types/Lang';
import { Transaction } from 'types/Transaction';
import { ErrorData } from 'types/Error';

import LangContext from 'contexts/LangContext';
import { useWeb3Context } from 'contexts/Web3Context';
import AccountDataContext from 'contexts/AccountDataContext';
import { MarketContext } from 'contexts/MarketContext';

import formatNumber from 'utils/formatNumber';
import { getSymbol } from 'utils/utils';

import numbers from 'config/numbers.json';

import keys from './translations.json';
import useMarket from 'hooks/useMarket';
import useETHRouter from 'hooks/useETHRouter';
import { WeiPerEther } from '@ethersproject/constants';
import handleOperationError from 'utils/handleOperationError';
import useApprove from 'hooks/useApprove';
import { LoadingButton } from '@mui/lab';

const DEFAULT_AMOUNT = BigNumber.from(numbers.defaultAmount);

const Withdraw: FC = () => {
  const { walletAddress, network } = useWeb3Context();
  const { accountData, getAccountData } = useContext(AccountDataContext);
  const { market } = useContext(MarketContext);

  const lang: string = useContext(LangContext);
  const translations: { [key: string]: LangKeys } = keys;

  const [qty, setQty] = useState<string>('');
  const [gasCost, setGasCost] = useState<BigNumber | undefined>();
  const [tx, setTx] = useState<Transaction | undefined>();
  const [isLoadingOp, setIsLoadingOp] = useState(false);
  const [errorData, setErrorData] = useState<ErrorData | undefined>();
  const [needsAllowance, setNeedsAllowance] = useState(false);
  const [isMax, setIsMax] = useState(false);

  const marketContract = useMarket(market?.value);

  const symbol = useMemo(() => {
    return market?.value ? getSymbol(market.value, network?.name) : 'DAI';
  }, [market?.value, network?.name]);

  const assets = useMemo(() => {
    if (!accountData) return;
    return accountData[symbol].floatingDepositAssets;
  }, [symbol, accountData]);

  const [parsedAmount, formattedAmount] = useMemo(() => {
    if (!assets || !accountData) return ['0', '0'];
    const amount = formatFixed(assets, accountData[symbol].decimals);
    return [amount, formatNumber(amount, symbol)];
  }, [accountData, assets, symbol]);

  const ETHRouterContract = useETHRouter();

  const {
    approve,
    estimateGas: approveEstimateGas,
    isLoading: approveIsLoading,
    errorData: approveErrorData,
  } = useApprove(marketContract, ETHRouterContract?.address);

  useEffect(() => {
    setQty('');
  }, [symbol]);

  const isLoading = useMemo(() => isLoadingOp || approveIsLoading, [isLoadingOp, approveIsLoading]);

  const needsApproval = useCallback(async () => {
    if (symbol !== 'WETH') return false;
    if (!walletAddress || !ETHRouterContract || !marketContract) return true;

    const allowance = await marketContract.allowance(walletAddress, ETHRouterContract.address);
    return allowance.lt(parseFixed(qty || '0', 18));
  }, [ETHRouterContract, marketContract, qty, symbol, walletAddress]);

  useEffect(() => {
    needsApproval()
      .then(setNeedsAllowance)
      .catch((error) => setErrorData({ status: true, message: handleOperationError(error) }));
  }, [needsApproval]);

  const previewGasCost = useCallback(async () => {
    if (!walletAddress || !marketContract || !ETHRouterContract || !accountData || !qty) return;

    const gasPrice = (await ETHRouterContract.provider.getFeeData()).maxFeePerGas;
    if (!gasPrice) return;

    if (await needsApproval()) {
      const gasEstimation = await approveEstimateGas();
      return setGasCost(gasEstimation ? gasPrice.mul(gasEstimation) : undefined);
    }

    const { floatingDepositShares } = accountData[symbol];
    if (symbol === 'WETH') {
      const amount = isMax ? floatingDepositShares : qty ? parseFixed(qty, 18) : DEFAULT_AMOUNT;
      const gasEstimation = await ETHRouterContract.estimateGas.redeem(amount);
      return setGasCost(gasPrice.mul(gasEstimation));
    }

    const decimals = await marketContract.decimals();
    const amount = isMax ? floatingDepositShares : qty ? parseFixed(qty, decimals) : DEFAULT_AMOUNT;
    const gasEstimation = await marketContract.estimateGas.redeem(amount, walletAddress, walletAddress);
    setGasCost(gasPrice.mul(gasEstimation));
  }, [
    qty,
    ETHRouterContract,
    accountData,
    approveEstimateGas,
    isMax,
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
  }, [errorData?.status, lang, previewGasCost, translations]);

  const onMax = useCallback(() => {
    setQty(parsedAmount);
    setIsMax(true);
  }, [parsedAmount]);

  const handleInputChange = useCallback(
    ({ target: { value, valueAsNumber } }: ChangeEvent<HTMLInputElement>) => {
      if (!accountData) return;
      const { decimals } = accountData[symbol];

      if (value.includes('.')) {
        const regex = /[^,.]*$/g;
        const inputDecimals = regex.exec(value)![0];
        if (inputDecimals.length > decimals) return;
      }

      if (valueAsNumber > parseFloat(parsedAmount)) {
        setErrorData({
          status: true,
          message: translations[lang].insufficientBalance,
        });
        return;
      }
      setQty(value);
      setErrorData(undefined);
      //we disable max flag if user changes input
      isMax && setIsMax(false);
    },
    [accountData, symbol, isMax, lang, parsedAmount, translations],
  );

  const withdraw = useCallback(async () => {
    if (!accountData || !walletAddress || !marketContract) return;

    let withdrawTx;
    try {
      setIsLoadingOp(true);
      const { decimals, floatingDepositShares } = accountData[symbol];

      if (symbol === 'WETH') {
        if (!ETHRouterContract) return;

        if (isMax) {
          const gasEstimation = await ETHRouterContract.estimateGas.redeem(floatingDepositShares);
          withdrawTx = await ETHRouterContract.redeem(floatingDepositShares, {
            gasLimit: gasEstimation.mul(parseFixed(String(numbers.gasLimitMultiplier), 18)).div(WeiPerEther),
          });
        } else {
          const gasEstimation = await ETHRouterContract.estimateGas.withdraw(parseFixed(qty, 18));
          withdrawTx = await ETHRouterContract.withdraw(parseFixed(qty, 18), {
            gasLimit: gasEstimation.mul(parseFixed(String(numbers.gasLimitMultiplier), 18)).div(WeiPerEther),
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
            gasLimit: gasEstimation.mul(parseFixed(String(numbers.gasLimitMultiplier), 18)).div(WeiPerEther),
          });
        } else {
          const gasEstimation = await marketContract.estimateGas.withdraw(
            parseFixed(qty, decimals),
            walletAddress,
            walletAddress,
          );

          withdrawTx = await marketContract.withdraw(parseFixed(qty, decimals), walletAddress, walletAddress, {
            gasLimit: gasEstimation.mul(parseFixed(String(numbers.gasLimitMultiplier), 18)).div(WeiPerEther),
          });
        }
      }

      setTx({ status: 'processing', hash: withdrawTx?.hash });

      const { status, transactionHash } = await withdrawTx.wait();

      setTx({ status: status ? 'success' : 'error', hash: transactionHash });

      getAccountData();
    } catch (error: any) {
      if (withdrawTx) setTx({ status: 'error', hash: withdrawTx?.hash });
      setErrorData({ status: true, message: handleOperationError(error) });
    } finally {
      setIsLoadingOp(false);
    }
  }, [ETHRouterContract, accountData, getAccountData, isMax, marketContract, qty, symbol, walletAddress]);

  const handleSubmitAction = useCallback(async () => {
    if (isLoading) return;
    // check needs allowance
    if (needsAllowance) {
      await approve();
      setErrorData(approveErrorData);
      setNeedsAllowance(await needsApproval());
      return;
    }

    return withdraw();
  }, [approve, approveErrorData, isLoading, needsAllowance, needsApproval, withdraw]);

  if (tx) return <ModalGif tx={tx} tryAgain={withdraw} />;

  return (
    <>
      <ModalTitle title={translations[lang].withdraw} />
      <ModalAsset
        asset={symbol}
        assetTitle={translations[lang].action.toUpperCase()}
        amount={parsedAmount}
        amountTitle={translations[lang].depositedAmount.toUpperCase()}
      />
      <ModalInput
        onMax={onMax}
        value={qty}
        onChange={handleInputChange}
        symbol={symbol}
        error={errorData?.component === 'input'}
      />
      {errorData?.component !== 'gas' && <ModalTxCost gasCost={gasCost} />}
      <ModalRow text={translations[lang].exactlyBalance} value={formattedAmount} line />
      <ModalRowHealthFactor qty={qty} symbol={symbol} operation="withdraw" />
      <ModalRowBorrowLimit qty={qty} symbol={symbol} operation="withdraw" line />
      {errorData && <ModalError message={errorData.message} />}
      <LoadingButton
        fullWidth
        sx={{ mt: 2 }}
        loading={isLoading}
        onClick={handleSubmitAction}
        color="primary"
        variant="contained"
        disabled={parseFloat(qty) <= 0 || !qty || isLoading || errorData?.status}
      >
        {needsAllowance ? translations[lang].approve : translations[lang].withdraw}
      </LoadingButton>
    </>
  );
};

export default Withdraw;
