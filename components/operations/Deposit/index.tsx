import React, { ChangeEvent, FC, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { BigNumber, formatFixed, parseFixed } from '@ethersproject/bignumber';
import { MaxUint256, WeiPerEther, Zero } from '@ethersproject/constants';
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

const DEFAULT_AMOUNT = BigNumber.from(numbers.defaultAmount);

const Deposit: FC = () => {
  const { web3Provider, walletAddress, network } = useWeb3Context();
  const { accountData, getAccountData } = useContext(AccountDataContext);
  const { market } = useContext(MarketContext);

  const lang: string = useContext(LangContext);
  const translations: { [key: string]: LangKeys } = keys;

  const [qty, setQty] = useState<string>('');
  const [walletBalance, setWalletBalance] = useState<string | undefined>(undefined);
  const [gasCost, setGasCost] = useState<BigNumber | undefined>();
  const [tx, setTx] = useState<Transaction | undefined>(undefined);
  const [isPending, setIsPending] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorData, setErrorData] = useState<ErrorData | undefined>(undefined);
  const [isLoadingAllowance, setIsLoadingAllowance] = useState(true); // utility to avoid estimating gas immediately when switching assets
  const [needsAllowance, setNeedsAllowance] = useState(true);
  const [assetContract, setAssetContract] = useState<ERC20 | null>(null);

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

  const debounceQty = useDebounce(qty, 1000); // 1 seconds before estimating gas on qty change

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
      if (!walletAddress) return;
      let balance;
      let decimals;

      if (symbol === 'WETH') {
        balance = await web3Provider?.getBalance(walletAddress);
        decimals = 18;
      } else {
        if (!assetContract || !marketContract) return;

        balance = await assetContract.balanceOf(walletAddress);
        decimals = await marketContract.decimals();
      }

      setWalletBalance(balance && formatFixed(balance, decimals));
    };

    void getWalletBalance();
  }, [walletAddress, symbol, web3Provider, marketContract, assetContract]);

  const updateNeedsAllowance = useCallback(async () => {
    setIsLoadingAllowance(true);
    try {
      if (symbol === 'WETH') {
        setNeedsAllowance(false);
        return;
      }
      if (!walletAddress || !assetContract || !marketContract || !accountData) return setNeedsAllowance(true);
      const { decimals } = accountData[symbol];
      const allowance = await assetContract.allowance(walletAddress, marketContract.address);

      setNeedsAllowance(allowance.lte(parseFixed(qty || '0', decimals)));
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

    const gasPrice = (await ETHRouterContract.provider.getFeeData()).maxFeePerGas ?? Zero;

    if (needsAllowance) {
      if (!marketContract || !assetContract) return;

      const gasLimit = await assetContract.estimateGas.approve(
        marketContract.address,
        debounceQty ? parseFixed(debounceQty, 18) : DEFAULT_AMOUNT,
      );

      setGasCost(gasPrice.gt(Zero) ? gasPrice.mul(gasLimit) : undefined);
      return;
    }

    if (symbol === 'WETH') {
      if (!ETHRouterContract) return;

      const gasLimit = await ETHRouterContract.estimateGas.deposit({
        value: debounceQty ? parseFixed(debounceQty, 18) : DEFAULT_AMOUNT,
      });

      setGasCost(gasPrice.gt(Zero) ? gasPrice.mul(gasLimit) : undefined);
      return;
    }

    if (!marketContract) throw new Error('Market contract is undefined');

    const decimals = await marketContract.decimals();
    const gasLimit = await marketContract.estimateGas.deposit(
      debounceQty ? parseFixed(debounceQty, decimals) : DEFAULT_AMOUNT,
      walletAddress,
    );

    setGasCost(gasPrice.gt(Zero) ? gasPrice.mul(gasLimit) : undefined);
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
      setIsPending(false);

      void updateNeedsAllowance();
    } catch (e) {
      captureException(e);
      setErrorData({ status: true });
    } finally {
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

      const txReceipt = await depositTx.wait();

      setTx({ status: txReceipt.status ? 'success' : 'error', hash: txReceipt?.transactionHash });

      getAccountData();
    } catch (error: any) {
      if (error?.message?.includes('User denied')) {
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
