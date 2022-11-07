import React, { ChangeEvent, FC, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { BigNumber, formatFixed, parseFixed } from '@ethersproject/bignumber';
import { MaxUint256, WeiPerEther } from '@ethersproject/constants';
import { Contract } from '@ethersproject/contracts';
import { captureException } from '@sentry/nextjs';

import { Market } from 'types/contracts/Market';
import { ERC20 } from 'types/contracts/ERC20';
import MarketABI from 'abi/Market.json';
import ERC20ABI from 'abi/ERC20.json';

import Button from 'components/common/Button';
import ModalAsset from 'components/common/modal/ModalAsset';
import ModalInput from 'components/common/modal/ModalInput';
import ModalRow from 'components/common/modal/ModalRow';
import ModalRowHealthFactor from 'components/common/modal/ModalRowHealthFactor';
import ModalTitle from 'components/common/modal/ModalTitle';
import ModalTxCost from 'components/common/modal/ModalTxCost';
import ModalGif from 'components/common/modal/ModalGif';
import ModalStepper from 'components/common/modal/ModalStepper';
import SkeletonModalRowBeforeAfter from 'components/common/skeletons/SkeletonModalRowBeforeAfter';
import ModalError from 'components/common/modal/ModalError';
import ModalRowBorrowLimit from 'components/common/modal/ModalRowBorrowLimit';

import { LangKeys } from 'types/Lang';
import { Transaction } from 'types/Transaction';
import { ErrorData } from 'types/Error';

import { getSymbol } from 'utils/utils';
import formatNumber from 'utils/formatNumber';

import styles from './style.module.scss';

import useDebounce from 'hooks/useDebounce';
import useETHRouter from 'hooks/useETHRouter';

import LangContext from 'contexts/LangContext';
import { useWeb3Context } from 'contexts/Web3Context';
import AccountDataContext from 'contexts/AccountDataContext';
import { MarketContext } from 'contexts/MarketContext';

import keys from './translations.json';
import numbers from 'config/numbers.json';
import { ErrorCode } from '@ethersproject/logger';

const DEFAULT_AMOUNT = BigNumber.from(numbers.defaultAmount);

const Deposit: FC = () => {
  const { web3Provider, walletAddress, network } = useWeb3Context();
  const { accountData, getAccountData } = useContext(AccountDataContext);
  const { market } = useContext(MarketContext);

  const lang: string = useContext(LangContext);
  const translations: { [key: string]: LangKeys } = keys;

  const [qty, setQty] = useState<string>('');
  const [walletBalance, setWalletBalance] = useState<string | undefined>();
  const [gasCost, setGasCost] = useState<BigNumber | undefined>();
  const [tx, setTx] = useState<Transaction | undefined>();
  const [isPending, setIsPending] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorData, setErrorData] = useState<ErrorData | undefined>();
  const [isLoadingAllowance, setIsLoadingAllowance] = useState(true); // utility to avoid estimating gas immediately when switching assets
  const [needsAllowance, setNeedsAllowance] = useState(true);
  const [assetContract, setAssetContract] = useState<ERC20 | undefined>();

  const debounceQty = useDebounce(qty, 1000); // 1 seconds before estimating gas on qty change
  const ETHRouterContract = useETHRouter();

  const marketContract = useMemo(() => {
    if (market?.value) {
      // TODO: get market address from previewer response/context + remove MarketContext
      return new Contract(market.value, MarketABI, web3Provider?.getSigner()) as Market;
    }
  }, [market, web3Provider]);

  const symbol = useMemo(
    () => (market?.value ? getSymbol(market.value, network?.name) : 'DAI'),
    [market?.value, network?.name],
  );

  // load asset contract
  useEffect(() => {
    if (!marketContract || symbol === 'WETH') return;

    const loadAssetContract = async () => {
      const assetAddress = await marketContract.asset();
      setAssetContract(new Contract(assetAddress, ERC20ABI, web3Provider?.getSigner()) as ERC20);
    };

    loadAssetContract().catch(captureException);
  }, [marketContract, symbol, web3Provider]);

  const depositedAmount = useMemo(() => {
    if (!symbol || !accountData) return '0';

    const { floatingDepositAssets, decimals } = accountData[symbol];
    return formatNumber(formatFixed(floatingDepositAssets, decimals), symbol);
  }, [accountData, symbol]);

  // set qty to '' when symbol changes
  useEffect(() => {
    setQty('');
  }, [symbol]);

  // load wallet balance
  useEffect(() => {
    const getWalletBalance = async () => {
      if (!walletAddress || !web3Provider) return;

      if (symbol === 'WETH') {
        const balance = await web3Provider.getBalance(walletAddress);
        return setWalletBalance(formatFixed(balance, 18));
      }

      if (!assetContract) return;

      const balance = await assetContract.balanceOf(walletAddress);
      const decimals = await assetContract.decimals();

      setWalletBalance(formatFixed(balance, decimals));
    };

    getWalletBalance().catch(captureException);
  }, [assetContract, symbol, walletAddress, web3Provider]);

  const updateNeedsAllowance = useCallback(async () => {
    setIsLoadingAllowance(true);
    try {
      if (symbol === 'WETH') {
        setNeedsAllowance(false);
        return;
      }

      if (!walletAddress || !assetContract || !marketContract || !accountData) return setNeedsAllowance(true);
      const decimals = await assetContract.decimals();
      const allowance = await assetContract.allowance(walletAddress, marketContract.address);

      setNeedsAllowance(allowance.lt(parseFixed(qty || '0', decimals)));
    } catch (error) {
      captureException(error);
      setNeedsAllowance(true);
    } finally {
      setIsLoadingAllowance(false);
    }
  }, [accountData, assetContract, marketContract, qty, symbol, walletAddress]);

  // execute updateNeedsAllowance on first render
  useEffect(() => {
    updateNeedsAllowance().catch(captureException);
  }, [updateNeedsAllowance]);

  const step = useMemo(() => {
    return needsAllowance || isLoadingAllowance ? 1 : 2;
  }, [needsAllowance, isLoadingAllowance]);

  const previewGasCost = useCallback(async () => {
    if (isLoadingAllowance || !symbol || !walletAddress || !ETHRouterContract) return;

    const gasPrice = (await ETHRouterContract.provider.getFeeData()).maxFeePerGas;
    if (!gasPrice) return;

    if (needsAllowance) {
      if (!marketContract || !assetContract) return;

      const gasLimit = await assetContract.estimateGas.approve(
        marketContract.address,
        debounceQty ? parseFixed(debounceQty, 18) : DEFAULT_AMOUNT,
      );

      setGasCost(gasPrice.mul(gasLimit));
      return;
    }

    if (symbol === 'WETH') {
      if (!ETHRouterContract) return;

      const gasLimit = await ETHRouterContract.estimateGas.deposit({
        value: debounceQty ? parseFixed(debounceQty, 18) : DEFAULT_AMOUNT,
      });

      setGasCost(gasPrice.mul(gasLimit));
      return;
    }

    if (!marketContract) throw new Error('Market contract is undefined');

    const decimals = await marketContract.decimals();
    const gasLimit = await marketContract.estimateGas.deposit(
      debounceQty ? parseFixed(debounceQty, decimals) : DEFAULT_AMOUNT,
      walletAddress,
    );

    setGasCost(gasPrice.mul(gasLimit));
  }, [needsAllowance, debounceQty, ETHRouterContract]);

  useEffect(() => {
    previewGasCost().catch((error) => {
      captureException(error);
      setErrorData({
        status: true,
        message: translations[lang].error,
        component: 'gas',
      });
    });
  }, [lang, previewGasCost, translations]);

  const approve = useCallback(async () => {
    if (symbol === 'WETH') return;
    try {
      if (!marketContract) throw new Error('Market not found');
      if (!assetContract) throw new Error('Asset not found');

      const gasEstimation = await assetContract.estimateGas.approve(marketContract.address, MaxUint256);
      const approveTx = await assetContract.approve(marketContract.address, MaxUint256, {
        gasLimit: gasEstimation.mul(parseFixed(String(numbers.gasLimitMultiplier), 18)).div(WeiPerEther),
      });

      setIsPending(true);
      await approveTx.wait();

      void updateNeedsAllowance();
    } catch (error: any) {
      const isDenied = error?.code === ErrorCode.ACTION_REJECTED;

      if (!isDenied) captureException(error);

      setErrorData({ status: true, message: translations[lang].deniedTransaction });
    } finally {
      setIsPending(false);
      setIsLoading(false);
    }
  }, [assetContract, marketContract, symbol, updateNeedsAllowance]);

  const onMax = () => {
    if (walletBalance) {
      setQty(walletBalance);
      setErrorData(undefined);
    }
  };

  const handleInputChange = ({ target: { value, valueAsNumber } }: ChangeEvent<HTMLInputElement>) => {
    if (!accountData || !symbol) return;
    const decimals = accountData[symbol].decimals;

    if (value.includes('.')) {
      const regex = /[^,.]*$/g;
      const inputDecimals = regex.exec(value)![0];
      if (inputDecimals.length > decimals) return;
    }
    if (step !== 1 && walletBalance && valueAsNumber > parseFloat(walletBalance)) {
      setErrorData({
        status: true,
        message: translations[lang].insufficientBalance,
        component: 'input',
      });
    } else {
      setErrorData(undefined);
    }

    setQty(value);
  };

  const deposit = useCallback(async () => {
    try {
      if (!symbol || !walletAddress) return;

      let depositTx;

      if (symbol === 'WETH') {
        if (!web3Provider || !ETHRouterContract) return;

        const gasEstimation = await ETHRouterContract.estimateGas.deposit({ value: parseFixed(qty, 18) });

        depositTx = await ETHRouterContract.deposit({
          value: parseFixed(qty, 18),
          gasLimit: gasEstimation.mul(parseFixed(String(numbers.gasLimitMultiplier), 18)).div(WeiPerEther),
        });
      } else {
        if (!marketContract) throw new Error('Market contract is undefined');
        const decimals = await marketContract.decimals();
        const depositAmount = parseFixed(qty, decimals);
        const gasEstimation = await marketContract.estimateGas.deposit(depositAmount, walletAddress);

        depositTx = await marketContract.deposit(depositAmount, walletAddress, {
          gasLimit: Math.ceil(Number(formatFixed(gasEstimation)) * numbers.gasLimitMultiplier),
        });
      }

      setTx({ status: 'processing', hash: depositTx.hash });

      const { status, transactionHash } = await depositTx.wait();

      setTx({ status: status ? 'success' : 'error', hash: transactionHash });

      getAccountData();
    } catch (error: any) {
      if (error?.code === ErrorCode.ACTION_REJECTED) {
        setErrorData({
          status: true,
          message: translations[lang].deniedTransaction,
        });
        return;
      }

      // txError
      if (error?.message?.includes(`"status":0`)) {
        const regex = new RegExp(/"hash":"(.*?)"/g); //regex to get all between ("hash":") and (")
        const preTxHash = error?.message?.match(regex); //get the hash from plain text by the regex
        const txErrorHash = preTxHash[0].substring(8, preTxHash[0].length - 1); //parse the string to get the txHash only
        captureException(error);
        setTx({ status: 'error', hash: txErrorHash });
      } else {
        captureException(error);
        setErrorData({
          status: true,
          message: translations[lang].generalError,
        });
      }
    } finally {
      setIsLoading(false);
    }
  }, [ETHRouterContract, getAccountData, lang, marketContract, qty, symbol, translations, walletAddress, web3Provider]);

  const handleSubmitAction = useCallback(() => {
    if (isPending || isLoadingAllowance) return;
    setIsLoading(true);
    return needsAllowance ? approve() : deposit();
  }, [approve, deposit, isLoadingAllowance, isPending, needsAllowance]);

  return (
    <>
      {!tx && (
        <>
          <ModalTitle title={translations[lang].variableRateDeposit} />
          <ModalAsset
            asset={symbol!}
            assetTitle={translations[lang].action.toUpperCase()}
            amount={walletBalance}
            amountTitle={translations[lang].walletBalance.toUpperCase()}
          />
          <ModalInput
            onMax={onMax}
            value={qty}
            onChange={handleInputChange}
            symbol={symbol!}
            error={errorData?.component === 'input'}
          />
          {errorData?.component !== 'gas' && <ModalTxCost gasCost={gasCost} />}
          <ModalRow text={translations[lang].exactlyBalance} value={depositedAmount} line />
          {symbol ? (
            <ModalRowHealthFactor qty={qty} symbol={symbol} operation="deposit" />
          ) : (
            <SkeletonModalRowBeforeAfter text={translations[lang].healthFactor} />
          )}
          <ModalRowBorrowLimit qty={qty} symbol={symbol!} operation="deposit" line />
          <ModalStepper currentStep={step} totalSteps={3} />
          {errorData && errorData.component !== 'gas' && <ModalError message={errorData.message} />}
          <div className={styles.buttonContainer}>
            <Button
              text={step === 1 ? translations[lang].approve : translations[lang].deposit}
              loading={isLoading}
              className={qty && parseFloat(qty) > 0 && !errorData?.status ? 'primary' : 'disabled'}
              disabled={((!qty || parseFloat(qty) <= 0) && !isPending) || isLoading || errorData?.status}
              onClick={handleSubmitAction}
            />
          </div>
        </>
      )}
      {tx && <ModalGif tx={tx} tryAgain={deposit} />}
    </>
  );
};

export default Deposit;
