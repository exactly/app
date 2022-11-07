import React, { ChangeEvent, FC, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { Contract } from '@ethersproject/contracts';
import { BigNumber, formatFixed, parseFixed } from '@ethersproject/bignumber';

import { Market } from 'types/contracts/Market';
import { ERC20 } from 'types/contracts/ERC20';
import MarketABI from 'abi/Market.json';
import ERC20ABI from 'abi/ERC20.json';

import Button from 'components/common/Button';
import ModalAsset from 'components/common/modal/ModalAsset';
import ModalInput from 'components/common/modal/ModalInput';
import ModalRowHealthFactor from 'components/common/modal/ModalRowHealthFactor';
import SkeletonModalRowBeforeAfter from 'components/common/skeletons/SkeletonModalRowBeforeAfter';
import ModalTitle from 'components/common/modal/ModalTitle';
import ModalTxCost from 'components/common/modal/ModalTxCost';
import ModalGif from 'components/common/modal/ModalGif';
import ModalError from 'components/common/modal/ModalError';
import ModalRowBorrowLimit from 'components/common/modal/ModalRowBorrowLimit';

import { LangKeys } from 'types/Lang';
import { Transaction } from 'types/Transaction';
import { ErrorData } from 'types/Error';
import { HealthFactor } from 'types/HealthFactor';

import { getSymbol } from 'utils/utils';
import getBeforeBorrowLimit from 'utils/getBeforeBorrowLimit';

import styles from './style.module.scss';

import useDebounce from 'hooks/useDebounce';

import LangContext from 'contexts/LangContext';
import { useWeb3Context } from 'contexts/Web3Context';
import { MarketContext } from 'contexts/MarketContext';
import AccountDataContext from 'contexts/AccountDataContext';

import keys from './translations.json';

import numbers from 'config/numbers.json';
import useETHRouter from 'hooks/useETHRouter';
import { captureException } from '@sentry/nextjs';
import { MaxUint256, WeiPerEther, Zero } from '@ethersproject/constants';

const DEFAULT_AMOUNT = BigNumber.from(numbers.defaultAmount);
const TX_REJECTED_CODE = 'ACTION_REJECTED';

const Borrow: FC = () => {
  const { web3Provider, walletAddress, network } = useWeb3Context();
  const { accountData, getAccountData } = useContext(AccountDataContext);
  const { market } = useContext(MarketContext);

  const lang: string = useContext(LangContext);
  const translations: { [key: string]: LangKeys } = keys;

  const [qty, setQty] = useState<string>('');
  // TODO: walletBalance type should be BigNumber
  const [walletBalance, setWalletBalance] = useState<string | undefined>();
  const [gasCost, setGasCost] = useState<BigNumber | undefined>();
  const [tx, setTx] = useState<Transaction | undefined>();
  const [isLoading, setIsLoading] = useState(false);
  const [errorData, setErrorData] = useState<ErrorData | undefined>();
  const [healthFactor, setHealthFactor] = useState<HealthFactor | undefined>();
  const [needsAllowance, setNeedsAllowance] = useState(true);
  const [isLoadingAllowance, setIsLoadingAllowance] = useState(true);

  const [assetContract, setAssetContract] = useState<ERC20 | undefined>();
  const ETHRouterContract = useETHRouter();

  const debounceQty = useDebounce(qty, 1000);

  const marketContract = useMemo(() => {
    if (!market) return undefined;
    return new Contract(market.value, MarketABI, web3Provider?.getSigner()) as Market;
  }, [market, web3Provider]);

  const symbol = useMemo(
    () => (market?.value ? getSymbol(market.value, network?.name) : 'DAI'),
    [market?.value, network?.name],
  );

  // done
  // load asset contract
  useEffect(() => {
    if (!marketContract) return;

    const loadAssetContract = async () => {
      const assetAddress = await marketContract.asset();
      setAssetContract(new Contract(assetAddress, ERC20ABI, web3Provider) as ERC20);
    };

    loadAssetContract().catch(captureException);
  }, [marketContract, web3Provider]);

  const liquidity = useMemo(() => {
    if (!accountData) return undefined;

    const limit = accountData[symbol].floatingAvailableAssets;
    return limit ?? undefined;
  }, [accountData, symbol]);

  // set qty to '' when symbol changes
  useEffect(() => {
    setQty('');
  }, [symbol]);

  // done
  const hasCollateral = useMemo(() => {
    if (!accountData || !marketContract) return;

    const isCollateral = Object.keys(accountData).some((aMarket) => accountData[aMarket].isCollateral);
    if (isCollateral) return true;

    const hasDepositedToFloatingPool = accountData[symbol].floatingDepositAssets.gt(Zero);
    if (hasDepositedToFloatingPool) return true;

    return false;
  }, [accountData, marketContract, symbol]);

  const updateNeedsAllowance = useCallback(async () => {
    setIsLoadingAllowance(true);
    try {
      if (symbol !== 'WETH') return setNeedsAllowance(false);
      if (!walletAddress || !ETHRouterContract || !marketContract) return;

      const allowance = await marketContract.allowance(walletAddress, ETHRouterContract.address);
      setNeedsAllowance(allowance.lte(parseFixed(debounceQty || '0', 18)));
    } catch (error) {
      setNeedsAllowance(true);
      captureException(error);
    } finally {
      setIsLoadingAllowance(false);
    }
  }, [ETHRouterContract, debounceQty, marketContract, symbol, walletAddress]);

  // execute updateNeedsAllowance on first render
  useEffect(() => {
    updateNeedsAllowance().catch(captureException);
  }, [updateNeedsAllowance]);

  const previewGasCost = useCallback(async () => {
    if (isLoadingAllowance || !symbol || !walletAddress || !marketContract || !ETHRouterContract) return;

    const gasPrice = (await ETHRouterContract.provider.getFeeData()).maxFeePerGas;
    if (!gasPrice) return;

    if (needsAllowance) {
      // only WETH needs allowance -> estimates directly with the ETH router
      const gasEstimation = await marketContract.estimateGas.approve(ETHRouterContract.address, MaxUint256);
      return setGasCost(gasPrice.mul(gasEstimation));
    }

    if (symbol === 'WETH') {
      const gasEstimation = await ETHRouterContract.estimateGas.borrow(
        debounceQty ? parseFixed(debounceQty, 18) : DEFAULT_AMOUNT,
      );
      return setGasCost(gasPrice.mul(gasEstimation));
    }

    const decimals = await marketContract.decimals();
    const gasEstimation = await marketContract.estimateGas.borrow(
      debounceQty ? parseFixed(debounceQty, decimals) : DEFAULT_AMOUNT,
      walletAddress,
      walletAddress,
    );
    setGasCost(gasPrice.mul(gasEstimation));
  }, [isLoadingAllowance, needsAllowance]);

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

  useEffect(() => {
    const loadBalance = async () => {
      if (!walletAddress || !web3Provider) return;

      if (symbol === 'WETH') return setWalletBalance(formatFixed(await web3Provider.getBalance(walletAddress), 18));
      if (!assetContract) return;

      const decimals = await assetContract.decimals();
      setWalletBalance(formatFixed(await assetContract.balanceOf(walletAddress), decimals));
    };

    loadBalance().catch(captureException);
  }, [assetContract, symbol, walletAddress, web3Provider]);

  const onMax = () => {
    if (!accountData || !healthFactor) return;

    const decimals = accountData[symbol].decimals;
    const adjustFactor = accountData[symbol].adjustFactor;
    const usdPrice = accountData[symbol].usdPrice;

    let col = healthFactor.collateral;
    const hf = parseFixed('1.05', 18);
    const WAD = parseFixed('1', 18);

    const hasDepositedToFloatingPool = Number(formatFixed(accountData![symbol].floatingDepositAssets, decimals)) > 0;

    if (!accountData![symbol].isCollateral && hasDepositedToFloatingPool) {
      col = col.add(accountData![symbol].floatingDepositAssets.mul(accountData![symbol].adjustFactor).div(WAD));
    }

    const debt = healthFactor.debt;

    const safeMaximumBorrow = Number(
      formatFixed(
        col.sub(hf.mul(debt).div(WAD)).mul(WAD).div(hf).mul(WAD).div(usdPrice).mul(adjustFactor).div(WAD),
        18,
      ),
    ).toFixed(decimals);

    setQty(safeMaximumBorrow);
    setErrorData(undefined);
  };

  const handleInputChange = ({ target: { value } }: ChangeEvent<HTMLInputElement>) => {
    if (!liquidity || !accountData) return;

    const decimals = accountData[symbol].decimals;
    const usdPrice = accountData[symbol].usdPrice;

    const maxBorrowAssets = getBeforeBorrowLimit(accountData, symbol, usdPrice, decimals, 'borrow');

    if (value.includes('.')) {
      const regex = /[^,.]*$/g;
      const inputDecimals = regex.exec(value)![0];
      if (inputDecimals.length > decimals) return;
    }

    setQty(value);

    if (liquidity.lt(parseFixed(value || '0', decimals))) {
      return setErrorData({
        status: true,
        message: translations[lang].availableLiquidityError,
      });
    }

    const WAD = parseFixed('1', 18);

    if (
      maxBorrowAssets.lt(
        parseFixed(value || '0', decimals)
          .mul(accountData[symbol].usdPrice)
          .div(WAD),
      )
    ) {
      return setErrorData({
        status: true,
        message: translations[lang].borrowLimit,
      });
    }

    setErrorData(undefined);
  };

  const borrow = useCallback(async () => {
    if (!accountData) return;

    setIsLoading(true);

    try {
      let borrowTx;

      if (symbol === 'WETH') {
        if (!ETHRouterContract) return;

        const amount = parseFixed(debounceQty, 18);
        const gasEstimation = await ETHRouterContract.estimateGas.borrow(amount);
        borrowTx = await ETHRouterContract.borrow(amount, {
          gasLimit: gasEstimation.mul(parseFixed(String(numbers.gasLimitMultiplier), 18)).div(WeiPerEther),
        });
      } else {
        if (!marketContract || !walletAddress) return;

        const decimals = await marketContract.decimals();
        const amount = parseFixed(debounceQty, decimals);
        const gasEstimation = await marketContract.estimateGas.borrow(amount, walletAddress, walletAddress);
        borrowTx = await marketContract.borrow(amount, walletAddress, walletAddress, {
          gasLimit: gasEstimation.mul(parseFixed(String(numbers.gasLimitMultiplier), 18)).div(WeiPerEther),
        });
      }

      setTx({ status: 'processing', hash: borrowTx.hash });

      const { status, transactionHash } = await borrowTx.wait();

      setTx({ status: status ? 'success' : 'error', hash: transactionHash });

      getAccountData();
    } catch (error: any) {
      setIsLoading(false);

      if (error?.code?.includes(TX_REJECTED_CODE)) {
        return setErrorData({
          status: true,
          message: translations[lang].deniedTransaction,
        });
      }

      const txError = error?.message?.includes(`"status":0`);

      if (txError) {
        const regex = new RegExp(/"hash":"(.*?)"/g); //regex to get all between ("hash":") and (")
        const preTxHash = error?.message?.match(regex); //get the hash from plain text by the regex
        const txErrorHash = preTxHash[0].substring(8, preTxHash[0].length - 1); //parse the string to get the txHash only
        return setTx({ status: 'error', hash: txErrorHash });
      }

      captureException(error);
      setErrorData({
        status: true,
        message: translations[lang].generalError,
      });
    } finally {
      setIsLoading(false);
    }
  }, [
    ETHRouterContract,
    accountData,
    debounceQty,
    getAccountData,
    lang,
    marketContract,
    symbol,
    translations,
    walletAddress,
  ]);

  const approve = useCallback(async () => {
    // only enters here on ETH market
    if (!marketContract || !ETHRouterContract) return;

    try {
      const gasEstimation = await marketContract.estimateGas.approve(ETHRouterContract.address, MaxUint256);

      const approveTx = await marketContract.approve(ETHRouterContract.address, MaxUint256, {
        gasLimit: gasEstimation.mul(parseFixed(String(numbers.gasLimitMultiplier), 18)).div(WeiPerEther),
      });

      await approveTx.wait();
      void updateNeedsAllowance();
    } catch (error: any) {
      const isDenied = error?.code?.includes(TX_REJECTED_CODE);

      if (!isDenied) captureException(error);

      setErrorData({
        status: true,
        message: isDenied ? translations[lang].deniedTransaction : translations[lang].generalError,
      });
    } finally {
      setIsLoading(false);
    }
  }, [ETHRouterContract, lang, marketContract, translations, updateNeedsAllowance]);

  const handleSubmitAction = useCallback(() => {
    if (isLoading) return;
    setIsLoading(true);
    return needsAllowance ? approve() : borrow();
  }, [approve, borrow, isLoading, needsAllowance]);

  return (
    <>
      {!tx && (
        <>
          <ModalTitle title={translations[lang].floatingPoolBorrow} />
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
          {symbol ? (
            <ModalRowHealthFactor qty={qty} symbol={symbol} operation="borrow" healthFactorCallback={setHealthFactor} />
          ) : (
            <SkeletonModalRowBeforeAfter text={translations[lang].healthFactor} />
          )}
          <ModalRowBorrowLimit qty={qty} symbol={symbol!} operation="borrow" line />
          {errorData && errorData.component !== 'gas' && <ModalError message={errorData.message} />}
          {hasCollateral != null && !hasCollateral && <ModalError message={translations[lang].noCollateral} />}
          <div className={styles.buttonContainer}>
            <Button
              text={needsAllowance ? translations[lang].approve : translations[lang].borrow}
              className={parseFloat(qty) <= 0 || !qty || errorData?.status ? 'disabled' : 'primary'}
              onClick={handleSubmitAction}
              disabled={parseFloat(qty) <= 0 || !qty || isLoading || errorData?.status}
              loading={isLoading}
            />
          </div>
        </>
      )}
      {tx && <ModalGif tx={tx} tryAgain={borrow} />}
    </>
  );
};

export default Borrow;
