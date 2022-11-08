import React, { ChangeEvent, FC, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { MaxUint256, WeiPerEther, Zero } from '@ethersproject/constants';
import { BigNumber, formatFixed, parseFixed } from '@ethersproject/bignumber';
import { Contract } from '@ethersproject/contracts';
import { ErrorCode } from '@ethersproject/logger';
import Box from '@mui/material/Box';
import LoadingButton from '@mui/lab/LoadingButton';
import { captureException } from '@sentry/nextjs';

import { ERC20 } from 'types/contracts/ERC20';
import ERC20ABI from 'abi/ERC20.json';

import ModalAsset from 'components/common/modal/ModalAsset';
import ModalInput from 'components/common/modal/ModalInput';
import ModalRowHealthFactor from 'components/common/modal/ModalRowHealthFactor';
import ModalTitle from 'components/common/modal/ModalTitle';
import ModalTxCost from 'components/common/modal/ModalTxCost';
import ModalGif from 'components/common/modal/ModalGif';
import ModalRowEditable from 'components/common/modal/ModalRowEditable';
import ModalMaturityEditable from 'components/common/modal/ModalMaturityEditable';
import ModalError from 'components/common/modal/ModalError';
import ModalRowBorrowLimit from 'components/common/modal/ModalRowBorrowLimit';
import ModalRowUtilizationRate from 'components/common/modal/ModalRowUtilizationRate';
import ModalCell from 'components/common/modal/ModalCell';

import { LangKeys } from 'types/Lang';
import { Transaction } from 'types/Transaction';
import { ErrorData } from 'types/Error';
import { HealthFactor } from 'types/HealthFactor';
import { FixedPool } from 'types/FixedLenderAccountData';

import { getSymbol, toPercentage } from 'utils/utils';
import getOneDollar from 'utils/getOneDollar';
import getBeforeBorrowLimit from 'utils/getBeforeBorrowLimit';

import LangContext from 'contexts/LangContext';
import { useWeb3Context } from 'contexts/Web3Context';
import { MarketContext } from 'contexts/MarketContext';
import AccountDataContext from 'contexts/AccountDataContext';

import useDebounce from 'hooks/useDebounce';
import useETHRouter from 'hooks/useETHRouter';
import useMarket from 'hooks/useMarket';
import useBalance from 'hooks/useBalance';
import usePoolLiquidity from 'hooks/usePoolLiquidity';
import useApprove from 'hooks/useApprove';
import usePreviewer from 'hooks/usePreviewer';

import keys from './translations.json';

import numbers from 'config/numbers.json';

const DEFAULT_AMOUNT = BigNumber.from(numbers.defaultAmount);

const BorrowAtMaturity: FC = () => {
  const { web3Provider, walletAddress, network } = useWeb3Context();
  const { accountData, getAccountData } = useContext(AccountDataContext);
  const { date, market } = useContext(MarketContext);

  const lang: string = useContext(LangContext);
  const translations: { [key: string]: LangKeys } = keys;

  const [qty, setQty] = useState<string>('');
  const [gasCost, setGasCost] = useState<BigNumber | undefined>();
  const [tx, setTx] = useState<Transaction | undefined>();
  const [fixedRate, setFixedRate] = useState<number | undefined>();
  const [slippage, setSlippage] = useState<number>(numbers.slippage);
  const [isSlippageEditable, setIsSlippageEditable] = useState(false);
  const [isLoadingOp, setIsLoadingOp] = useState(false);
  const [healthFactor, setHealthFactor] = useState<HealthFactor | undefined>();
  const [urBefore, setUrBefore] = useState<string | undefined>();
  const [urAfter, setUrAfter] = useState<string | undefined>();
  const [needsAllowance, setNeedsAllowance] = useState(true);
  const [isLoadingAllowance, setIsLoadingAllowance] = useState(true);
  const [errorData, setErrorData] = useState<ErrorData | undefined>();
  const [assetContract, setAssetContract] = useState<ERC20 | undefined>();

  const ETHRouterContract = useETHRouter();
  const marketContract = useMarket(market?.value);

  const previewerContract = usePreviewer();

  const {
    approve,
    errorData: approveErrorData,
    isLoading: approveIsLoading,
  } = useApprove(marketContract, ETHRouterContract?.address);

  const debounceQty = useDebounce(qty);

  const symbol = useMemo(() => {
    return market?.value ? getSymbol(market.value, network?.name) : 'DAI';
  }, [market?.value, network?.name]);

  // load asset contract
  useEffect(() => {
    if (!marketContract || symbol === 'WETH') return;

    const loadAssetContract = async () => {
      const assetAddress = await marketContract.asset();
      setAssetContract(new Contract(assetAddress, ERC20ABI, web3Provider?.getSigner()) as ERC20);
    };

    loadAssetContract().catch(captureException);
  }, [marketContract, symbol, web3Provider]);

  const walletBalance = useBalance(symbol, assetContract);
  const poolLiquidity = usePoolLiquidity(symbol);

  // check has collateral
  useEffect(() => {
    if (!accountData) return;

    const hasCollateral =
      // isCollateral
      accountData[symbol].floatingDepositAssets.gt(Zero) ||
      // hasDepositedToFloatingPool
      Object.keys(accountData).some((aMarket) => accountData[aMarket].isCollateral);

    if (!hasCollateral) {
      setErrorData({
        status: true,
        message: translations[lang].noCollateral,
      });
    }
  }, [accountData, lang, symbol, translations]);

  useEffect(() => {
    setQty('');
  }, [symbol, date]);

  const previewGasCost = useCallback(async () => {
    if (isLoadingAllowance || !symbol || !walletAddress || !marketContract || !ETHRouterContract || !date) return;

    const gasPrice = (await ETHRouterContract.provider.getFeeData()).maxFeePerGas;
    if (!gasPrice) return;

    if (needsAllowance) {
      // only WETH needs allowance -> estimates directly with the ETH router
      const gasEstimation = await marketContract.estimateGas.approve(ETHRouterContract.address, MaxUint256);
      return setGasCost(gasPrice.mul(gasEstimation));
    }

    if (symbol === 'WETH') {
      const amount = debounceQty ? parseFixed(debounceQty, 18) : DEFAULT_AMOUNT;
      const maxAmount = amount.mul(parseFixed(String(1 + slippage), 18)).div(WeiPerEther);

      const gasEstimation = await ETHRouterContract.estimateGas.borrowAtMaturity(date.value, amount, maxAmount);

      return setGasCost(gasPrice.mul(gasEstimation));
    }

    const decimals = await marketContract.decimals();
    const amount = debounceQty ? parseFixed(debounceQty, decimals) : DEFAULT_AMOUNT;
    const maxAmount = amount.mul(parseFixed(String(1 + slippage), 18)).div(WeiPerEther);
    const gasEstimation = await marketContract.estimateGas.borrowAtMaturity(
      date.value,
      amount,
      maxAmount,
      walletAddress,
      walletAddress,
    );
    setGasCost(gasPrice.mul(gasEstimation));
  }, [
    ETHRouterContract,
    date,
    debounceQty,
    isLoadingAllowance,
    marketContract,
    needsAllowance,
    slippage,
    symbol,
    walletAddress,
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

  // TODO: extract new hook useAllowance
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
  }, [ETHRouterContract, marketContract, qty, symbol, walletAddress]);

  // execute updateNeedsAllowance on first render
  useEffect(() => {
    updateNeedsAllowance().catch(captureException);
  }, [updateNeedsAllowance]);

  function onMax() {
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
  }

  function handleInputChange({ target: { value, valueAsNumber } }: ChangeEvent<HTMLInputElement>) {
    if (poolLiquidity && poolLiquidity < valueAsNumber) {
      return setErrorData({
        status: true,
        message: translations[lang].availableLiquidityError,
      });
    }

    if (!accountData) return;
    const decimals = accountData[symbol].decimals;
    const usdPrice = accountData[symbol].usdPrice;

    const maxBorrowAssets = getBeforeBorrowLimit(accountData, symbol, usdPrice, decimals, 'borrow');

    if (value.includes('.')) {
      const regex = /[^,.]*$/g;
      const inputDecimals = regex.exec(value)![0];
      if (inputDecimals.length > decimals) return;
    }

    setQty(value);

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
  }

  const borrow = useCallback(async () => {
    setIsLoadingOp(true);

    if (fixedRate && slippage < fixedRate) {
      setIsLoadingOp(false);

      return setErrorData({
        status: true,
        message: translations[lang].notEnoughSlippage,
      });
    }

    if (!accountData || !date || !qty) return;

    const { decimals } = accountData[symbol];
    const amount = parseFixed(qty, decimals);
    const maxAmount = amount.mul(parseFixed(String(1 + slippage), 18)).div(WeiPerEther);

    let borrowTx;
    try {
      if (symbol === 'WETH') {
        if (!ETHRouterContract) throw new Error('ETHRouterContract is undefined');

        const gasEstimation = await ETHRouterContract.estimateGas.borrowAtMaturity(date.value, amount, maxAmount);

        borrowTx = await ETHRouterContract.borrowAtMaturity(date.value, amount, maxAmount, {
          gasLimit: gasEstimation.mul(parseFixed(String(numbers.gasLimitMultiplier), 18)).div(WeiPerEther),
        });
      } else {
        if (!marketContract) throw new Error('Market contract not found');
        if (!walletAddress) throw new Error('Wallet address not found');

        const gasEstimation = await marketContract.estimateGas.borrowAtMaturity(
          date.value,
          amount,
          maxAmount,
          walletAddress,
          walletAddress,
        );

        borrowTx = await marketContract.borrowAtMaturity(date.value, amount, maxAmount, walletAddress, walletAddress, {
          gasLimit: gasEstimation.mul(parseFixed(String(numbers.gasLimitMultiplier), 18)).div(WeiPerEther),
        });
      }

      setTx({ status: 'processing', hash: borrowTx?.hash });

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

      setTx({ status: 'error', hash: borrowTx?.hash });
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
    date,
    fixedRate,
    getAccountData,
    lang,
    marketContract,
    qty,
    slippage,
    symbol,
    translations,
    walletAddress,
  ]);

  const updateAPR = useCallback(async () => {
    if (!accountData || !date || !previewerContract || !marketContract) return;

    const { decimals, usdPrice } = accountData[symbol];
    const currentTimestamp = new Date().getTime() / 1000;

    const initialAssets = debounceQty ? parseFixed(debounceQty, decimals) : getOneDollar(usdPrice, decimals);

    try {
      const feeAtMaturity = await previewerContract.previewBorrowAtMaturity(
        marketContract.address,
        date.value,
        initialAssets,
      );

      const time = 31_536_000 / (Number(date.value) - currentTimestamp);
      const { assets: finalAssets } = feeAtMaturity;

      const rate = finalAssets.mul(WeiPerEther).div(initialAssets);

      const fixedAPR = (Number(formatFixed(rate, 18)) - 1) * time;
      const slippageAPR = fixedAPR * (1 + numbers.slippage);
      setSlippage(slippageAPR);
      setFixedRate(fixedAPR);
    } catch (error) {
      return setFixedRate(undefined);
    }
  }, [accountData, date, debounceQty, marketContract, previewerContract, symbol]);

  // update APR
  useEffect(() => {
    updateAPR().catch(captureException);
  }, [updateAPR]);

  // load initial utilization rate
  useEffect(() => {
    if (!accountData || !date) return;

    const { utilization: utBefore } = accountData[symbol].fixedPools.find(
      ({ maturity }) => maturity.toString() === date.value,
    ) as FixedPool;

    setUrBefore((Number(formatFixed(utBefore, 18)) * 100).toFixed(2));
  }, [accountData, date, symbol]);

  const updateURAfter = useCallback(async () => {
    if (!marketContract || !previewerContract || !date || !accountData) return;
    if (!debounceQty) return setUrAfter(urBefore);

    try {
      const { decimals, usdPrice } = accountData[symbol];
      const initialAssets = debounceQty ? parseFixed(debounceQty, decimals) : getOneDollar(usdPrice, decimals);

      const { utilization } = await previewerContract.previewBorrowAtMaturity(
        marketContract.address,
        date.value,
        initialAssets,
      );

      setUrAfter((Number(formatFixed(utilization, 18)) * 100).toFixed(2));
    } catch (error) {
      setUrAfter('N/A');
    }
  }, [accountData, date, debounceQty, marketContract, previewerContract, symbol, urBefore]);

  useEffect(() => {
    updateURAfter().catch(captureException);
  }, [updateURAfter]);

  const isLoading = isLoadingOp || approveIsLoading;

  const handleSubmitAction = async () => {
    if (isLoading) return;
    if (!needsAllowance) return borrow();

    await approve();
    setErrorData(approveErrorData);
    void updateNeedsAllowance();
  };

  if (tx) return <ModalGif tx={tx} tryAgain={borrow} />;

  return (
    <>
      <ModalTitle title={translations[lang].fixedRateBorrow} />
      <ModalAsset
        asset={symbol}
        assetTitle={translations[lang].action.toUpperCase()}
        amount={walletBalance}
        amountTitle={translations[lang].walletBalance.toUpperCase()}
      />
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          borderBottom: '1px dashed #d9d9d9',
        }}
      >
        <ModalMaturityEditable text={translations[lang].maturityPool} />
        <ModalCell text={translations[lang].apr} value={toPercentage(fixedRate)} line />
      </Box>
      <ModalInput onMax={onMax} value={qty} onChange={handleInputChange} symbol={symbol} />
      {errorData?.component !== 'gas' && symbol !== 'WETH' && <ModalTxCost gasCost={gasCost} />}
      <ModalRowEditable
        text={translations[lang].maximumBorrowApr}
        value={toPercentage(slippage)}
        editable={isSlippageEditable}
        onChange={({ target: { value } }: ChangeEvent<HTMLInputElement>) => {
          setSlippage(Number(value) / 100);
          errorData?.message === translations[lang].notEnoughSlippage && setErrorData(undefined);
        }}
        onClick={() => setIsSlippageEditable((prev) => !prev)}
        line
      />
      <ModalRowHealthFactor qty={qty} symbol={symbol} operation="borrow" healthFactorCallback={setHealthFactor} />
      <ModalRowBorrowLimit qty={qty} symbol={symbol} operation="borrow" line />
      <ModalRowUtilizationRate urBefore={urBefore} urAfter={urAfter} line />

      {errorData && errorData.component !== 'gas' && <ModalError message={errorData.message} />}

      <LoadingButton
        fullWidth
        sx={{ mt: 2 }}
        loading={isLoading}
        onClick={handleSubmitAction}
        color="primary"
        variant="contained"
        disabled={parseFloat(qty) <= 0 || !qty || isLoading || errorData?.status}
      >
        {needsAllowance ? translations[lang].approve : translations[lang].borrow}
      </LoadingButton>
    </>
  );
};

export default BorrowAtMaturity;
