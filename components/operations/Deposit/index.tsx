import React, { ChangeEvent, FC, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { BigNumber, formatFixed, parseFixed } from '@ethersproject/bignumber';
import { MaxUint256, Zero } from '@ethersproject/constants';
import { Contract } from '@ethersproject/contracts';

import { Market } from 'types/contracts/Market';
import { ERC20 } from 'types/contracts/ERC20';
import MarketABI from 'abi/Market.json';
import ERC20ABI from 'abi/ERC20.json';

import { MarketETHRouter } from 'types/contracts/MarketETHRouter';
import MarketETHRouterABI from 'abi/MarketETHRouter.json';

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

import LangContext from 'contexts/LangContext';
import { useWeb3Context } from 'contexts/Web3Context';
import AccountDataContext from 'contexts/AccountDataContext';
import { MarketContext } from 'contexts/MarketContext';

import keys from './translations.json';

import numbers from 'config/numbers.json';
import getNetworkName from 'utils/getNetworkName';

const DEFAULT_QTY_ESTIMATION = '0.001';
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
  const [step, setStep] = useState<number | undefined>(undefined);
  const [pending, setPending] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<ErrorData | undefined>(undefined);
  const [isLoadingAllowance, setIsLoadingAllowance] = useState(true); // utility to avoid estimating gas immediately when switching assets
  const [needsAllowance, setNeedsAllowance] = useState(true);
  const [assetContract, setAssetContract] = useState<ERC20 | null>(null);
  const [marketETHRouterContract, setMarketETHRouterContract] = useState<MarketETHRouter | undefined>(undefined);

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

  // load marketETHRouterContract
  // TODO: consider moving this to a hook
  useEffect(() => {
    const loadMarketETHRouter = async () => {
      if (!network) return;

      try {
        const { address } = await import(
          `protocol/deployments/${getNetworkName(network.chainId)}/MarketETHRouter.json`,
          {
            assert: { type: 'json' },
          }
        );

        setMarketETHRouterContract(
          new Contract(address, MarketETHRouterABI, web3Provider?.getSigner()) as MarketETHRouter,
        );
      } catch (e) {
        console.log('Failed to load market ETH router');
        console.error(e);
      }
    };
    void loadMarketETHRouter();
  }, [network, web3Provider]);

  // load asset contract
  useEffect(() => {
    const loadAssetContract = async () => {
      if (!marketContract || symbol === 'WETH') return;

      try {
        const assetAddress = await marketContract.asset();

        setAssetContract(new Contract(assetAddress, ERC20ABI, web3Provider?.getSigner()) as ERC20);
      } catch (error) {
        console.log('Error reading asset from market contract');
        console.error(error);
      }
    };
    void loadAssetContract();
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
    } catch (e) {
      console.error(e);
      setNeedsAllowance(true);
    } finally {
      setIsLoadingAllowance(false);
    }
  }, [accountData, assetContract, marketContract, qty, symbol, walletAddress]);

  // execute updateNeedsAllowance on first render
  useEffect(() => {
    void updateNeedsAllowance();
  }, [updateNeedsAllowance]);

  // set step to 2 only when already !needsAllowance and !isLoadingAllowance
  useEffect(() => {
    if (needsAllowance || isLoadingAllowance) setStep(1);
    else setStep(2);
  }, [needsAllowance, isLoadingAllowance]);

  const previewGasCost = useCallback(async () => {
    if (isLoadingAllowance || !symbol || !walletAddress) return;

    let gasPrice = Zero,
      gasLimit = Zero;

    if (needsAllowance) {
      try {
        if (!marketContract || !assetContract) return;

        gasPrice = (await assetContract.provider.getFeeData()).maxFeePerGas || Zero;
        gasLimit = await assetContract.estimateGas.approve(
          marketContract.address,
          parseFixed(debounceQty || DEFAULT_QTY_ESTIMATION, 18),
        );
      } catch (e) {
        console.log(e);
        setError({
          status: true,
          message: translations[lang].error,
          component: 'gas',
        });
      }

      if (gasPrice.gt(Zero) && gasLimit.gt(Zero)) {
        setGasCost(gasPrice.mul(gasLimit));
      }
      return;
    }

    try {
      if (symbol === 'WETH') {
        if (!marketETHRouterContract) throw new Error('MarketETHRouterContract is undefined');

        gasPrice = (await marketETHRouterContract.provider.getFeeData()).maxFeePerGas || Zero;
        gasLimit = await marketETHRouterContract.estimateGas.deposit({
          value: parseFixed(debounceQty || DEFAULT_QTY_ESTIMATION, 18),
        });

        if (gasPrice.gt(Zero) && gasLimit.gt(Zero)) {
          setGasCost(gasPrice.mul(gasLimit));
        }
        return;
      }

      if (!marketContract) throw new Error('Market contract is undefined');

      const decimals = await marketContract.decimals();
      gasPrice = (await marketContract.provider.getFeeData()).maxFeePerGas || Zero;
      gasLimit = await marketContract.estimateGas.deposit(
        parseFixed(debounceQty || DEFAULT_QTY_ESTIMATION, decimals),
        walletAddress,
      );

      if (gasPrice && gasLimit) {
        setGasCost(gasPrice.mul(gasLimit));
      }
    } catch (e) {
      console.log(e);
      setError({
        status: true,
        message: translations[lang].error,
        component: 'gas',
      });
    }
  }, [needsAllowance, debounceQty]);

  useEffect(() => {
    void previewGasCost();
  }, [previewGasCost]);

  const approve = async () => {
    if (symbol === 'WETH') return;
    if (!marketContract) throw new Error('Market not found');
    if (!assetContract) throw new Error('Asset not found');

    try {
      const gasEstimation = await assetContract.estimateGas.approve(marketContract.address, MaxUint256);
      const approveTx = await assetContract.approve(marketContract.address, MaxUint256, {
        gasLimit: Math.ceil(Number(formatFixed(gasEstimation)) * numbers.gasLimitMultiplier),
      });

      setPending(true);
      await approveTx.wait();
      setPending(false);

      void updateNeedsAllowance();
    } catch (e) {
      console.error(e);

      setError({
        status: true,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const onMax = () => {
    if (walletBalance) {
      setQty(walletBalance);
      setError(undefined);
    }
  };

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (!accountData || !symbol) return;
    const decimals = accountData[symbol].decimals;

    if (e.target.value.includes('.')) {
      const regex = /[^,.]*$/g;
      const inputDecimals = regex.exec(e.target.value)![0];
      if (inputDecimals.length > decimals) return;
    }
    if (step !== 1 && walletBalance && e.target.valueAsNumber > parseFloat(walletBalance)) {
      setError({
        status: true,
        message: translations[lang].insufficientBalance,
        component: 'input',
      });
    } else {
      setError(undefined);
    }

    setQty(e.target.value);
  };

  const deposit = async () => {
    try {
      if (!symbol || !walletAddress) return;

      let depositTx;

      if (symbol === 'WETH') {
        if (!web3Provider || !marketETHRouterContract) return;

        const gasEstimation = await marketETHRouterContract.estimateGas.deposit({ value: parseFixed(qty, 18) });

        depositTx = await marketETHRouterContract.deposit({
          value: parseFixed(qty, 18),
          gasLimit: Math.ceil(Number(formatFixed(gasEstimation)) * numbers.gasLimitMultiplier),
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

      if (txReceipt.status === 1) {
        setTx({ status: 'success', hash: txReceipt?.transactionHash });
      } else {
        setTx({ status: 'error', hash: txReceipt?.transactionHash });
      }

      getAccountData();
    } catch (e: any) {
      console.log(e);

      const isDenied = e?.message?.includes('User denied');

      const txError = e?.message?.includes(`"status":0`);
      let txErrorHash = undefined;

      if (txError) {
        const regex = new RegExp(/"hash":"(.*?)"/g); //regex to get all between ("hash":") and (")
        const preTxHash = e?.message?.match(regex); //get the hash from plain text by the regex
        txErrorHash = preTxHash[0].substring(8, preTxHash[0].length - 1); //parse the string to get the txHash only
      }

      if (isDenied) {
        setError({
          status: true,
          message: isDenied ? translations[lang].deniedTransaction : translations[lang].notEnoughSlippage,
        });
      } else if (txError) {
        setTx({ status: 'error', hash: txErrorHash });
      } else {
        setError({
          status: true,
          message: translations[lang].generalError,
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmitAction = () => {
    setIsLoading(true);
    if (step === 1 && !pending && symbol !== 'WETH') {
      return approve();
    } else if (!pending) {
      return deposit();
    }
  };

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
            error={error?.component === 'input'}
          />
          {error?.component !== 'gas' && <ModalTxCost gasCost={gasCost} />}
          <ModalRow text={translations[lang].exactlyBalance} value={depositedAmount} line />
          {symbol ? (
            <ModalRowHealthFactor qty={qty} symbol={symbol} operation="deposit" />
          ) : (
            <SkeletonModalRowBeforeAfter text={translations[lang].healthFactor} />
          )}
          <ModalRowBorrowLimit qty={qty} symbol={symbol!} operation="deposit" line />
          <ModalStepper currentStep={step} totalSteps={3} />
          {error && error.component !== 'gas' && <ModalError message={error.message} />}
          <div className={styles.buttonContainer}>
            <Button
              text={step === 1 ? translations[lang].approve : translations[lang].deposit}
              loading={isLoading}
              className={qty && parseFloat(qty) > 0 && !error?.status ? 'primary' : 'disabled'}
              disabled={((!qty || parseFloat(qty) <= 0) && !pending) || isLoading || error?.status}
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
