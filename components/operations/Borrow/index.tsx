import React, { ChangeEvent, FC, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { captureException } from '@sentry/nextjs';
import { BigNumber, formatFixed, parseFixed } from '@ethersproject/bignumber';
import { WeiPerEther, Zero } from '@ethersproject/constants';
import { ErrorCode } from '@ethersproject/logger';
import LoadingButton from '@mui/lab/LoadingButton';

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

import useDebounce from 'hooks/useDebounce';
import useETHRouter from 'hooks/useETHRouter';

import LangContext from 'contexts/LangContext';
import { useWeb3Context } from 'contexts/Web3Context';
import { MarketContext } from 'contexts/MarketContext';
import AccountDataContext from 'contexts/AccountDataContext';

import keys from './translations.json';
import numbers from 'config/numbers.json';
import useApprove from 'hooks/useApprove';
import useBalance from 'hooks/useBalance';
import useMarket from 'hooks/useMarket';
import useERC20 from 'hooks/useERC20';

const DEFAULT_AMOUNT = BigNumber.from(numbers.defaultAmount);

const Borrow: FC = () => {
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
  const [healthFactor, setHealthFactor] = useState<HealthFactor | undefined>();
  const [needsAllowance, setNeedsAllowance] = useState(true);
  const [isLoadingAllowance, setIsLoadingAllowance] = useState(true);
  const [assetAddress, setAssetAddress] = useState<string | undefined>();

  const ETHRouterContract = useETHRouter();

  const debounceQty = useDebounce(qty);

  const marketContract = useMarket(market?.value);

  const symbol = useMemo(
    () => (market?.value ? getSymbol(market.value, network?.name) : 'DAI'),
    [market?.value, network?.name],
  );

  useEffect(() => {
    if (!marketContract || symbol === 'WETH') return;

    const loadAssetAddress = async () => setAssetAddress(await marketContract.asset());

    loadAssetAddress().catch(captureException);
  }, [marketContract, symbol]);

  const assetContract = useERC20(assetAddress);

  const {
    approve,
    estimateGas: approveEstimateGas,
    isLoading: approveIsLoading,
    errorData: approveErrorData,
  } = useApprove(marketContract, ETHRouterContract?.address);

  const walletBalance = useBalance(symbol, assetContract);

  const liquidity = useMemo(() => {
    if (!accountData) return undefined;

    const limit = accountData[symbol].floatingAvailableAssets;
    return limit ?? undefined;
  }, [accountData, symbol]);

  // set qty to '' when symbol changes
  useEffect(() => {
    setQty('');
  }, [symbol]);

  const hasCollateral = useMemo(() => {
    if (!accountData) return false;

    return (
      // isCollateral
      accountData[symbol].floatingDepositAssets.gt(Zero) ||
      // hasDepositedToFloatingPool
      Object.keys(accountData).some((aMarket) => accountData[aMarket].isCollateral)
    );
  }, [accountData, symbol]);

  const updateNeedsAllowance = useCallback(async () => {
    setIsLoadingAllowance(true);
    try {
      if (symbol !== 'WETH') return setNeedsAllowance(false);
      if (!walletAddress || !ETHRouterContract || !marketContract) return;

      const allowance = await marketContract.allowance(walletAddress, ETHRouterContract.address);
      setNeedsAllowance(allowance.lt(parseFixed(qty || '0', 18)));
    } catch (error) {
      setNeedsAllowance(true);
      captureException(error);
    } finally {
      setIsLoadingAllowance(false);
    }
  }, [ETHRouterContract, qty, marketContract, symbol, walletAddress]);

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
      const gasEstimation = await approveEstimateGas();
      return setGasCost(gasEstimation ? gasPrice.mul(gasEstimation) : undefined);
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
  }, [
    isLoadingAllowance,
    symbol,
    walletAddress,
    marketContract,
    ETHRouterContract,
    needsAllowance,
    debounceQty,
    approveEstimateGas,
  ]);

  useEffect(() => {
    previewGasCost().catch((error) => {
      setErrorData({
        error,
        status: true,
        message: translations[lang].error,
        component: 'gas',
      });
    });
  }, [lang, previewGasCost, translations]);

  const onMax = () => {
    if (!accountData || !healthFactor) return;

    const decimals = accountData[symbol].decimals;
    const adjustFactor = accountData[symbol].adjustFactor;
    const usdPrice = accountData[symbol].usdPrice;

    let col = healthFactor.collateral;
    const hf = parseFixed('1.05', 18);
    const WAD = parseFixed('1', 18);

    const hasDepositedToFloatingPool = Number(formatFixed(accountData[symbol].floatingDepositAssets, decimals)) > 0;

    if (!accountData[symbol].isCollateral && hasDepositedToFloatingPool) {
      col = col.add(accountData[symbol].floatingDepositAssets.mul(accountData[symbol].adjustFactor).div(WAD));
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

    setIsLoadingOp(true);
    let borrowTx;

    try {
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
      if (error?.code === ErrorCode.ACTION_REJECTED) {
        return setErrorData({
          status: true,
          message: translations[lang].deniedTransaction,
        });
      }

      if (borrowTx?.hash) {
        setTx({ status: 'error', hash: borrowTx.hash });
      }

      captureException(error);
      setErrorData({
        status: true,
        message: translations[lang].generalError,
      });
    } finally {
      setIsLoadingOp(false);
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

  const isLoading = useMemo(() => approveIsLoading || isLoadingOp, [approveIsLoading, isLoadingOp]);

  const handleSubmitAction = useCallback(async () => {
    if (isLoading) return;
    if (needsAllowance) {
      await approve();
      setErrorData(approveErrorData);
      void updateNeedsAllowance();
    }
    return needsAllowance ? approve() : borrow();
  }, [approve, approveErrorData, borrow, isLoading, needsAllowance, updateNeedsAllowance]);

  if (tx) return <ModalGif tx={tx} tryAgain={borrow} />;

  return (
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
      <LoadingButton
        fullWidth
        sx={{ mt: 2 }}
        loading={isLoading}
        onClick={handleSubmitAction}
        color="primary"
        variant="contained"
        disabled={!qty || parseFloat(qty) <= 0 || errorData?.status}
      >
        {needsAllowance ? translations[lang].approve : translations[lang].borrow}
      </LoadingButton>
    </>
  );
};

export default Borrow;
